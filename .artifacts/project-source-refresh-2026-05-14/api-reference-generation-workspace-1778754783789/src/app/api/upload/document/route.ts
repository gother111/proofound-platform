import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { deleteUploadedFile, ingestUploadedFile, UPLOAD_KINDS } from '@/lib/uploads/lifecycle';
import { rejectOversizedUploadRequest } from '@/lib/uploads/request-size';

const TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'text/plain': 'TXT',
  'text/markdown': 'Markdown',
};
const DOCUMENT_UPLOAD_MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oversizedResponse = rejectOversizedUploadRequest(request, DOCUMENT_UPLOAD_MAX_FILE_BYTES);
    if (oversizedResponse) {
      return oversizedResponse;
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

    if (upload.status === 'manual_review') {
      return NextResponse.json(
        {
          success: true,
          status: 'manual_review',
          uploadedFileId: upload.uploadedFileId,
          artifactDisplayName: upload.artifactDisplayName,
          fileName: upload.artifactDisplayName,
          fileSize: file.size,
          fileType:
            TYPE_LABELS[upload.detectedMime || file.type] || upload.detectedMime || file.type,
          message: 'Upload received and held for privacy review before it can be attached.',
        },
        { status: 202 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'attachable',
      uploadedFileId: upload.uploadedFileId,
      artifactDisplayName: upload.artifactDisplayName,
      fileName: upload.artifactDisplayName,
      fileSize: file.size,
      fileType: TYPE_LABELS[upload.detectedMime || file.type] || upload.detectedMime || file.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isFileSizeError = message.includes('File size exceeds');
    const isValidationError =
      isFileSizeError || message.includes('batch') || message.includes('limit');

    if (!isValidationError) {
      return safeApiErrorResponse({
        event: 'upload.document.failed',
        error,
        status: 500,
        publicMessage: 'Upload failed',
      });
    }

    return NextResponse.json(
      {
        error: 'Upload rejected',
        message: isFileSizeError
          ? 'The uploaded file is too large for this upload flow.'
          : 'The upload could not be accepted for this flow.',
      },
      { status: 400 }
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
    const fileId = searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json({ error: 'File id required' }, { status: 400 });
    }

    const deleted = await deleteUploadedFile(fileId, user.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'upload.document_delete.failed',
      error,
      status: 500,
      publicMessage: 'Delete failed',
    });
  }
}
