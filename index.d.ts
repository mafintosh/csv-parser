declare module 'csv-parser' {
  import { Transform } from 'stream';

  interface CsvParser extends Transform {}
  interface CsvParserOptions {
    escape?: string;
    headers?: ReadonlyArray<string> | boolean;
    mapHeaders?: (args: { header: string; index: number }) => string | null;
    mavValues?: (args: { header: string; index: number; value: any }) => any;
    newline?: string;
    quote?: string;
    raw?: boolean;
    separator?: string;
    skipLines?: number;
    maxRowBytes?: number;
    strict?: boolean;
  }

  const csvParser: (
    optionsOrHeaders?: CsvParserOptions | ReadonlyArray<string>
  ) => CsvParser;

  export = csvParser;
}
