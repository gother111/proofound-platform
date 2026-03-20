import { NextResponse } from 'next/server';

export type PortfolioExportFormat = 'pdf' | 'json' | 'text';

export function resolvePortfolioExportFormat(request: Request): PortfolioExportFormat {
  const format = new URL(request.url).searchParams.get('format');

  if (format === 'json') {
    return 'json';
  }

  if (format === 'text') {
    return 'text';
  }

  return 'pdf';
}

export function respondWithJson(data: unknown, filename: string) {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export function respondWithText(text: string, filename: string) {
  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export function respondWithPdf(bytes: Uint8Array, filename: string) {
  const bodyBytes = new Uint8Array(bytes.byteLength);
  bodyBytes.set(bytes);
  const body = new Blob([bodyBytes], { type: 'application/pdf' });

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': bytes.byteLength.toString(),
    },
  });
}
