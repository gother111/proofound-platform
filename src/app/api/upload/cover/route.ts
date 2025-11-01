import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for cover images
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const supabase = await createClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('user-uploads').getPublicUrl(filePath);

    // Update appropriate profile
    if (profileType === 'organization' && orgId) {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ cover_image_url: publicUrl })
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
        .update({ cover_image_url: publicUrl })
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
      url: publicUrl,
      path: uploadData.path,
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
