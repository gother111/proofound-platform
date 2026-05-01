import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  createAuthenticatedClient,
  createAnonClient,
  createServiceRoleClient,
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './helpers/supabase-test-client';

const PRIVATE_BUCKETS = ['user-uploads-quarantine', 'user-uploads-private'] as const;
const LEGACY_PUBLIC_BUCKET = 'user-uploads';
const TESTED_BUCKETS = [...PRIVATE_BUCKETS, LEGACY_PUBLIC_BUCKET];

let alice: TestUser;
let bob: TestUser;
let prefix: string;

const uploadedObjects: Array<{ bucket: string; path: string }> = [];

function objectBody(label: string) {
  return new Blob([`%PDF-1.4\n% Proofound privacy storage fixture: ${label}\n%%EOF\n`], {
    type: 'application/pdf',
  });
}

function expectStorageBlocked<T>(
  result: { data: T | null; error: { message?: string } | null },
  message: string
) {
  const emptyArray = Array.isArray(result.data) && result.data.length === 0;
  expect(
    Boolean(result.error) || result.data === null || emptyArray,
    `${message} - got data: ${JSON.stringify(result.data)}`
  ).toBe(true);
}

describe('Storage bucket policies and signed URLs', () => {
  beforeAll(async () => {
    const ts = Date.now();
    prefix = `privacy-storage/${ts}`;
    alice = await createTestUser(`storage-alice+${ts}@test.com`, 'password123');
    bob = await createTestUser(`storage-bob+${ts}@test.com`, 'password123');

    const service = createServiceRoleClient();
    for (const bucket of PRIVATE_BUCKETS) {
      const path = `${prefix}/${bucket}/alice-proof.pdf`;
      const { error } = await service.storage.from(bucket).upload(path, objectBody(bucket), {
        contentType: 'application/pdf',
        upsert: true,
      });
      expect(error, `setup upload should succeed for ${bucket}`).toBeNull();
      uploadedObjects.push({ bucket, path });
    }
  });

  afterAll(async () => {
    const service = createServiceRoleClient();
    for (const object of uploadedObjects) {
      await service.storage.from(object.bucket).remove([object.path]);
    }
    await deleteTestUser(alice.id);
    await deleteTestUser(bob.id);
  });

  test('quarantine/private buckets exist and no upload bucket is public', async () => {
    const service = createServiceRoleClient();
    const { data, error } = await service.storage.listBuckets();

    expect(error).toBeNull();
    const relevantBuckets = (data ?? []).filter((bucket) => TESTED_BUCKETS.includes(bucket.id));
    const bucketById = new Map(relevantBuckets.map((bucket) => [bucket.id, bucket]));

    for (const bucket of PRIVATE_BUCKETS) {
      expect(bucketById.get(bucket), `${bucket} should exist`).toBeTruthy();
      expect(bucketById.get(bucket)?.public, `${bucket} must be private`).toBe(false);
    }

    const legacy = bucketById.get(LEGACY_PUBLIC_BUCKET);
    if (legacy) {
      expect(legacy.public, 'legacy public upload bucket must be disabled').toBe(false);
    }
  });

  test('quarantine and private buckets are not listable by anonymous or authenticated users', async () => {
    const anonClient = createAnonClient();
    const aliceClient = await createAuthenticatedClient(alice.email, alice.password);
    const bobClient = await createAuthenticatedClient(bob.email, bob.password);

    for (const bucket of PRIVATE_BUCKETS) {
      const anonList = await anonClient.storage.from(bucket).list(prefix);
      expectStorageBlocked(anonList, `${bucket} should not be anonymously listable`);

      const aliceList = await aliceClient.storage.from(bucket).list(prefix);
      expectStorageBlocked(aliceList, `${bucket} should not be listable by Alice`);

      const bobList = await bobClient.storage.from(bucket).list(prefix);
      expectStorageBlocked(bobList, `${bucket} should not be listable by Bob`);
    }
  });

  test('private objects are inaccessible without service-created signed URLs', async () => {
    const bobClient = await createAuthenticatedClient(bob.email, bob.password);

    for (const object of uploadedObjects) {
      const directDownload = await bobClient.storage.from(object.bucket).download(object.path);
      expectStorageBlocked(
        directDownload,
        `${object.bucket} object should not be directly downloadable by another user`
      );

      const signedByBob = await bobClient.storage
        .from(object.bucket)
        .createSignedUrl(object.path, 60);
      expectStorageBlocked(
        signedByBob,
        `${object.bucket} signed URL creation should be blocked for another user`
      );

      const publicUrl = createServiceRoleClient()
        .storage.from(object.bucket)
        .getPublicUrl(object.path).data.publicUrl;
      const publicResponse = await fetch(publicUrl);
      expect(
        publicResponse.status,
        `${object.bucket} public URL must not expose private object`
      ).not.toBe(200);
    }
  });

  test('service-created signed URLs work briefly and then expire', async () => {
    const service = createServiceRoleClient();
    const object =
      uploadedObjects.find((item) => item.bucket === 'user-uploads-private') ?? uploadedObjects[0];

    const { data, error } = await service.storage
      .from(object.bucket)
      .createSignedUrl(object.path, 5);
    expect(error).toBeNull();
    expect(data?.signedUrl).toBeTruthy();

    const allowed = await fetch(data!.signedUrl);
    expect(allowed.status, 'fresh signed URL should allow object access').toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 6500));

    const expired = await fetch(data!.signedUrl);
    expect(expired.status, 'expired signed URL should stop allowing object access').not.toBe(200);
  });
});
