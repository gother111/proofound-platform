import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { deleteUploadedFile, ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';
import { rejectOversizedUploadRequest } from '@/lib/uploads/request-size';

const AVATAR_UPLOAD_MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oversizedResponse = rejectOversizedUploadRequest(request, AVATAR_UPLOAD_MAX_FILE_BYTES);
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const upload = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: user.id,
      sourceSurface: 'avatar_upload',
      uploadKind: UPLOAD_KINDS.AVATAR,
      attachedSubjectType: 'individual_profile',
      attachedSubjectId: user.id,
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

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: upload.url })
      .eq('id', user.id);

    if (updateError) {
      return safeApiErrorResponse({
        event: 'upload.avatar_profile_update.failed',
        error: updateError,
        status: 500,
        publicMessage: 'Failed to update profile',
        context: { userId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      uploadedFileId: upload.uploadedFileId,
      url: upload.url,
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'upload.avatar.failed',
      error,
      status: 500,
      publicMessage: 'Upload failed',
    });
  }
}

// DELETE endpoint to remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current avatar URL to extract path
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (!profile?.avatar_url) {
      return NextResponse.json({ error: 'No avatar to delete' }, { status: 404 });
    }

    const fileId = new URL(request.url).searchParams.get('fileId');
    if (fileId) {
      const deleted = await deleteUploadedFile(fileId, user.id);
      if (!deleted) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      return safeApiErrorResponse({
        event: 'upload.avatar_delete_profile_update.failed',
        error: updateError,
        status: 500,
        publicMessage: 'Failed to update profile',
        context: { userId: user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'upload.avatar_delete.failed',
      error,
      status: 500,
      publicMessage: 'Delete failed',
    });
  }
}
