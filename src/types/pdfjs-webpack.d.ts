declare module 'pdfjs-dist/webpack.mjs' {
  const pdfjs: typeof import('pdfjs-dist/build/pdf.mjs');
  export default pdfjs;
}
