import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteUploadedFile, ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';

const TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
  'image/png': 'PNG',
  'image/heif': 'HEIF',
  'image/heic': 'HEIC',
  'image/webp': 'WebP',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null; // 'proof', 'certificate', 'artifact'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploadKind =
      category === 'proof'
        ? UPLOAD_KINDS.PROOF
        : category === 'certificate'
          ? UPLOAD_KINDS.CERTIFICATE
          : category === 'artifact'
            ? UPLOAD_KINDS.ARTIFACT
            : UPLOAD_KINDS.DOCUMENT;
    const upload = await ingestUploadedFile(file, {
      ownerType: 'individual_profile',
      ownerId: user.id,
      sourceSurface: 'document_upload',
      uploadKind,
      attachedSubjectType: category ?? 'document',
      attachedSubjectId: null,
    });

    if (upload.status === 'rejected') {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          status: 'rejected',
          uploadedFileId: upload.uploadedFileId,
          message:
            upload.safetyReason === 'mime_signature_mismatch'
              ? 'The uploaded file type did not match its file signature.'
              : 'The uploaded file is not allowed for this proof or document flow.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'ready',
      uploadedFileId: upload.uploadedFileId,
      url: upload.url,
      path: upload.storagePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: TYPE_LABELS[upload.detectedMime || file.type] || upload.detectedMime || file.type,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a document
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    const fileId = searchParams.get('fileId');
    if (fileId) {
      const deleted = await deleteUploadedFile(fileId, user.id);
      if (!deleted) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (!filePath.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();
    const { error: deleteError } = await supabase.storage
      .from('user-uploads-private')
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      {
        error: 'Delete failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
