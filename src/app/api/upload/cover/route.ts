import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const profileType = formData.get('profileType') as string | null; // 'individual' or 'organization'
    const orgId = formData.get('orgId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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

    const supabase = await createClient();

    // Update appropriate profile
    if (profileType === 'organization' && orgId) {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ cover_image_url: upload.url })
        .eq('id', orgId);

      if (updateError) {
        console.error('Organization update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update organization', details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from('individual_profiles')
        .update({ cover_image_url: upload.url })
        .eq('profile_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile', details: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      uploadedFileId: upload.uploadedFileId,
      url: upload.url,
      path: upload.storagePath,
    });
  } catch (error) {
    console.error('Cover upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
