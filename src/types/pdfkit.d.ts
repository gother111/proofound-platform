// Minimal type shims for pdfkit to satisfy TypeScript during build.
declare module 'pdfkit' {
  // Minimal constructor signature; actual implementation is broader.
  const PDFDocument: new (...args: unknown[]) => unknown;
  export default PDFDocument;
}

// pdfkit also exposes a global namespace in the implementation; we declare
// it loosely so references like `PDFKit.Mixins` do not error at build time.
declare namespace PDFKit {
  type Mixins = unknown;
  type StructureElement = unknown;
  class PDFDocument {
    constructor(...args: unknown[]);
  }
}
