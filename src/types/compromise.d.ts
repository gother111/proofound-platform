/**
 * Type declarations for compromise NLP library
 */
declare module 'compromise' {
  interface Document {
    nouns(): Document;
    verbs(): Document;
    adjectives(): Document;
    match(pattern: string): Document;
    text(): string;
    out(format?: 'text' | 'array' | 'tags'): string | string[];
    json(): any[];
  }

  function nlp(text: string): Document;
  export = nlp;
}
