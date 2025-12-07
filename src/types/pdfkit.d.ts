// Minimal type shims for pdfkit to satisfy TypeScript during build.
declare module 'pdfkit' {
  const PDFDocument: any;
  export default PDFDocument;
}

// pdfkit also exposes a global namespace in the implementation; we declare
// it loosely so references like `PDFKit.Mixins` do not error at build time.
declare namespace PDFKit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Mixins = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type StructureElement = any;
  // Minimal class shape for PDFDocument used in code.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class PDFDocument {
    constructor(...args: any[]);
  }
}
