#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
import PDFDocument from 'pdfkit';

import { extractTextFromDocument } from '../src/lib/expertise/document-extraction-provider';
import { resolveGcpCvOcrSafeStatus } from '../src/lib/expertise/gcp-cv-ocr-status';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ quiet: true });

const args = new Set(process.argv.slice(2));
const statusOnly = args.has('--status') || args.has('--status-only');
const requireLive = args.has('--require-live');

async function main() {
  const status = await resolveGcpCvOcrSafeStatus({ probeProvider: true });
  console.log(`CV OCR status: ${status.status}`);

  if (statusOnly) {
    return;
  }

  if (status.status !== 'provider reachable') {
    if (requireLive) {
      fail('Synthetic PDF smoke requires the OCR provider to be reachable.');
    }

    console.log('Synthetic PDF smoke: skipped');
    return;
  }

  const syntheticPdf = await buildSyntheticPdf();
  const result = await extractTextFromDocument(
    {
      requestId: 'ocr_smoke_request',
      userRef: {
        kind: 'opaque_user_ref',
        value: 'ocr_smoke_operator',
      },
      documentId: 'doc_synthetic_ocr_smoke',
      contentType: 'application/pdf',
      fileBytes: syntheticPdf,
      metadata: {
        source: 'synthetic-smoke',
        sizeBytes: syntheticPdf.byteLength,
      },
    },
    {
      timeoutMs: 15000,
    }
  );

  if (result.status === 'completed' && !result.fallback && result.text.trim().length > 0) {
    console.log('Synthetic PDF smoke: passed');
    return;
  }

  fail(
    `Synthetic PDF smoke failed with safe status: ${result.fallback ? 'fallback' : result.status}`
  );
}

function buildSyntheticPdf(): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      margin: 72,
      metadata: {
        Title: 'Proofound Synthetic OCR Smoke',
        Author: 'Proofound',
        Subject: 'Synthetic OCR smoke test',
      },
    });
    const chunks: Buffer[] = [];

    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    document.on('error', reject);

    document.fontSize(18).text('Proofound Synthetic OCR Smoke', { underline: false });
    document.moveDown();
    document.fontSize(12).text('This one-page document contains synthetic test text only.');
    document.text('Skills: TypeScript, React, accessibility, structured review.');
    document.text('Purpose: verify the production OCR provider path without real user data.');
    document.end();
  });
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : 'Synthetic PDF smoke failed.');
});
