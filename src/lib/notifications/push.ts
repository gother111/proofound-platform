import { createSign } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { mobileDeviceTokens, notificationPreferences, pushDeliveryAttempts } from '@/db/schema';
import type { NotificationType } from '@/lib/notifications';

const APNS_SANDBOX_URL = 'https://api.sandbox.push.apple.com';
const APNS_PRODUCTION_URL = 'https://api.push.apple.com';
const APNS_TOKEN_TTL_SECONDS = 50 * 60;

type DeviceEnvironment = 'sandbox' | 'production';

type PushPayload = {
  aps: {
    alert: {
      title: string;
      body: string;
    };
    sound: string;
    badge?: number;
  };
  metadata?: Record<string, unknown>;
};

type DeliveryInput = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function toBase64Url(input: Buffer | string) {
  const raw = typeof input === 'string' ? Buffer.from(input) : input;
  return raw.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getApnsEnv() {
  const keyId = process.env.APNS_KEY_ID?.trim();
  const teamId = process.env.APNS_TEAM_ID?.trim();
  const bundleId = process.env.APNS_BUNDLE_ID?.trim();
  const privateKeyRaw = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();

  if (!keyId || !teamId || !bundleId || !privateKeyRaw) {
    return null;
  }

  return { keyId, teamId, bundleId, privateKeyRaw };
}

function getProviderToken() {
  const env = getApnsEnv();
  if (!env) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.expiresAt > nowSeconds + 60) {
    return cachedToken.token;
  }

  const header = toBase64Url(
    JSON.stringify({
      alg: 'ES256',
      kid: env.keyId,
    })
  );
  const payload = toBase64Url(
    JSON.stringify({
      iss: env.teamId,
      iat: nowSeconds,
    })
  );

  const unsigned = `${header}.${payload}`;
  const signer = createSign('SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(env.privateKeyRaw);
  const signed = `${unsigned}.${toBase64Url(signature)}`;

  cachedToken = {
    token: signed,
    expiresAt: nowSeconds + APNS_TOKEN_TTL_SECONDS,
  };

  return signed;
}

function pushPreferenceKey(
  type: NotificationType
): keyof typeof notificationPreferences.$inferSelect {
  switch (type) {
    case 'match_suggested':
      return 'pushMatchSuggested';
    case 'intro_accepted':
      return 'pushIntroAccepted';
    case 'message_received':
      return 'pushMessageReceived';
    case 'verification_requested':
      return 'pushVerificationRequested';
    case 'verification_completed':
      return 'pushVerificationCompleted';
    case 'assignment_published':
      return 'pushAssignmentPublished';
    case 'interview_scheduled':
      return 'pushInterviewScheduled';
    case 'contract_signed':
      return 'pushContractSigned';
    default:
      return 'pushMatchSuggested';
  }
}

function endpointFor(environment: DeviceEnvironment) {
  return environment === 'production' ? APNS_PRODUCTION_URL : APNS_SANDBOX_URL;
}

async function sendPush(
  deviceToken: string,
  environment: DeviceEnvironment,
  payload: PushPayload
): Promise<{ ok: true; apnsId: string | null } | { ok: false; code: string; message: string }> {
  const env = getApnsEnv();
  const providerToken = getProviderToken();

  if (!env || !providerToken) {
    return {
      ok: false,
      code: 'apns_env_missing',
      message: 'APNS environment is not configured',
    };
  }

  const response = await fetch(`${endpointFor(environment)}/3/device/${deviceToken}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${providerToken}`,
      'apns-topic': env.bundleId,
      'apns-push-type': 'alert',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return {
      ok: true,
      apnsId: response.headers.get('apns-id'),
    };
  }

  let reason = 'apns_rejected';
  let details = 'Push rejected by APNS';
  try {
    const body = (await response.json()) as { reason?: string };
    if (body?.reason) {
      reason = body.reason;
      details = body.reason;
    }
  } catch {
    // ignore JSON parse failure
  }

  return {
    ok: false,
    code: reason,
    message: details,
  };
}

export async function enqueuePushForNotification(input: DeliveryInput): Promise<void> {
  const pref = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, input.userId),
  });

  if (pref) {
    const key = pushPreferenceKey(input.type);
    if (!pref[key]) {
      return;
    }
  }

  const tokens = await db.query.mobileDeviceTokens.findMany({
    where: and(eq(mobileDeviceTokens.userId, input.userId), eq(mobileDeviceTokens.enabled, true)),
  });

  if (!tokens.length) {
    return;
  }

  const payload: PushPayload = {
    aps: {
      alert: {
        title: input.title,
        body: input.message,
      },
      sound: 'default',
    },
    metadata: input.metadata ?? undefined,
  };

  for (const token of tokens) {
    const attemptBase = {
      notificationId: input.notificationId,
      tokenId: token.id,
      attemptedAt: new Date(),
    };

    try {
      const result = await sendPush(token.token, token.environment, payload);

      if (result.ok) {
        await db.insert(pushDeliveryAttempts).values({
          ...attemptBase,
          status: 'sent',
          apnsId: result.apnsId,
        });
      } else {
        await db.insert(pushDeliveryAttempts).values({
          ...attemptBase,
          status: 'failed',
          errorCode: result.code,
          errorMessage: result.message,
        });

        // Token invalidation according to APNS reason codes.
        if (['BadDeviceToken', 'Unregistered'].includes(result.code)) {
          await db
            .update(mobileDeviceTokens)
            .set({
              enabled: false,
              updatedAt: new Date(),
            })
            .where(eq(mobileDeviceTokens.id, token.id));
        }
      }
    } catch (error) {
      await db.insert(pushDeliveryAttempts).values({
        ...attemptBase,
        status: 'failed',
        errorCode: 'push_dispatch_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
