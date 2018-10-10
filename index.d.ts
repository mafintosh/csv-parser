/// <reference types="node" />

import { Transform } from "stream";

declare const _export: (optionsOrHeaders?: CsvParserOptions | ReadonlyArray<string>) => CsvParser;
export default _export;

export interface CsvParserOptions {
  escape?: string;
  headers?: ReadonlyArray<string> | boolean;
  mapHeaders?: (args: { header: string, index: number }) => string | null;
  mavValues?: (args: { header: string, index: number, value: any }) => any;
  newline?: string;
  quote?: string;
  raw?: boolean;
  separator?: string;
  skipLines?: number;
  maxRowBytes?: number;
  strict?: boolean;
}

export interface CsvParser extends Transform {

}
