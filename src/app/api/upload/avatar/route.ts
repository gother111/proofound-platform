import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteUploadedFile, ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
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
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      uploadedFileId: upload.uploadedFileId,
      url: upload.url,
      path: upload.storagePath,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
      await deleteUploadedFile(fileId);
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      {
        error: 'Delete failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
