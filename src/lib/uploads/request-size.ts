import { NextResponse } from 'next/server';

type HeaderReader = {
  get(name: string): string | null;
};

export const MULTIPART_UPLOAD_OVERHEAD_BYTES = 64 * 1024;

function parseContentLength(value: string | null | undefined) {
  if (!value || !/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function rejectOversizedUploadRequest(
  request: { headers?: HeaderReader },
  maxFileBytes: number
) {
  const contentLength = parseContentLength(request.headers?.get('content-length'));
  const maxRequestBytes = maxFileBytes + MULTIPART_UPLOAD_OVERHEAD_BYTES;

  if (contentLength === null || contentLength <= maxRequestBytes) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'Upload rejected',
      message: 'The upload request is too large for this flow.',
    },
    { status: 413 }
  );
}
