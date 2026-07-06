import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import { authorize } from '@/lib/authz';
import { getCanonicalActiveOrgMembership } from '@/lib/api/auth';
import { deleteUploadedFile, ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';
import { rejectOversizedUploadRequest } from '@/lib/uploads/request-size';

const COVER_UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oversizedResponse = rejectOversizedUploadRequest(request, COVER_UPLOAD_MAX_FILE_BYTES);
    if (oversizedResponse) {
      return oversizedResponse;
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    const file = formData.get('file') as File | null;
    const profileType = formData.get('profileType') as string | null; // 'individual' or 'organization'
    const orgId = formData.get('orgId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const supabase = await createClient();
    if (profileType === 'organization' && orgId) {
      const membership = await getCanonicalActiveOrgMembership(supabase, user.id, orgId);
      if (
        !authorize({
          resource: 'org_profile',
          action: 'update',
          orgRole: membership?.role,
        }).allowed
      ) {
        return NextResponse.json(
          { error: 'Only organization owners can update organization cover images' },
          { status: 403 }
        );
      }
    }

    const attachedSubjectType =
      profileType === 'organization' && orgId ? 'organization' : 'individual_profile';
    const attachedSubjectId = profileType === 'organization' && orgId ? orgId : user.id;
    const upload = await ingestUploadedFile(file, {
      ownerType: attachedSubjectType,
      ownerId: attachedSubjectId,
      sourceSurface: 'cover_upload',
      uploadKind: UPLOAD_KINDS.COVER,
      attachedSubjectType,
      attachedSubjectId,
    });

    if (upload.status === 'rejected' || !upload.url) {
      return NextResponse.json(
        {
          error: 'Invalid file',
          status: 'rejected',
          uploadedFileId: upload.uploadedFileId,
          reason: upload.safetyReason,
        },
        { status: 400 }
      );
    }

    // Update appropriate profile
    if (profileType === 'organization' && orgId) {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ cover_image_url: upload.url })
        .eq('id', orgId);

      if (updateError) {
        await deleteUploadedFile(upload.uploadedFileId, orgId).catch((cleanupError) => {
          log.error('upload.cover_cleanup.organization_failed', {
            uploadedFileId: upload.uploadedFileId,
            orgId,
            error: sanitizeErrorForLog(cleanupError),
          });
        });
        return safeApiErrorResponse({
          event: 'upload.cover_organization_update.failed',
          error: updateError,
          status: 500,
          publicMessage: 'Failed to update organization',
          context: { orgId },
        });
      }
    } else {
      const { error: updateError } = await supabase
        .from('individual_profiles')
        .update({ cover_image_url: upload.url })
        .eq('profile_id', user.id);

      if (updateError) {
        await deleteUploadedFile(upload.uploadedFileId, user.id).catch((cleanupError) => {
          log.error('upload.cover_cleanup.individual_failed', {
            uploadedFileId: upload.uploadedFileId,
            userId: user.id,
            error: sanitizeErrorForLog(cleanupError),
          });
        });
        return safeApiErrorResponse({
          event: 'upload.cover_profile_update.failed',
          error: updateError,
          status: 500,
          publicMessage: 'Failed to update profile',
          context: { userId: user.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      uploadedFileId: upload.uploadedFileId,
      url: upload.url,
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'upload.cover.failed',
      error,
      status: 500,
      publicMessage: 'Upload failed',
    });
  }
}
