declare module 'pdfkit' {
  export type PDFKitDocumentOptions = Record<string, unknown>;

  class PDFDocument {
    constructor(options?: PDFKitDocumentOptions);

    on(event: string, listener: (...args: any[]) => void): this;

    fontSize(size: number): this;
    font(name: string): this;
    fillColor(color: string): this;
    text(text: string, options?: any): this;
    moveDown(lines?: number): this;

    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;

    end(): void;

    y: number;
    page: { width: number; height: number };
  }

  export default PDFDocument;
}

declare module 'pdfkit/js/pdfkit.standalone.js' {
  import PDFDocument from 'pdfkit';

  export default PDFDocument;
}

declare namespace PDFKit {
  // Minimal surface used by our code (PDFKit.PDFDocument).
  type PDFDocument = import('pdfkit').default;
}
