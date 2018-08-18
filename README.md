[tests]: 	http://img.shields.io/travis/mafintosh/csv-parser.svg
[tests-url]: http://travis-ci.org/mafintosh/csv-parser

[cover]: https://codecov.io/gh/mafintosh/csv-parser/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/mafintosh/csv-parser

[size]: https://packagephobia.now.sh/badge?p=fwv
[size-url]: https://packagephobia.now.sh/result?p=fwv

# csv-parser

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]

Streaming CSV parser that aims for maximum speed as well as compatibility with
the [csv-spectrum](https://npmjs.org/csv-spectrum) CSV acid test suite.

`csv-parser` can convert CSV into JSON at at rate of around 90,000 rows per
second. Performance varies with the data used; try `bin/bench.js <your file>`
to benchmark your data.

`csv-parser` can be used in the browser with [browserify](http://browserify.org/).

[neat-csv](https://github.com/sindresorhus/neat-csv) can be used if a `Promise`
based interface to `csv-parser` is needed.

_Note: This module requires Node v6.14.0 or higher._

## Install

Using npm:

```console
$ npm install csv-parser
```

Using yarn:

```console
$ yarn add csv-parser
```

## Usage

To use the module, create a readable stream to a desired CSV file, instantiate
`csv`, and pipe the stream to `csv`.

Suppose you have a CSV file `data.csv` which contains the data:

```
NAME, AGE
Daffy Duck, 24
Bugs Bunny, 22
```

It could then be parsed, and results shown like so:

``` js
const csv = require('csv-parser')
const fs = require('fs')
const results = [];

fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', results.push)
  .on('end', () => {
    console.log(results);
    // [
    //   { NAME: 'Daffy Duck', AGE: 24 },
    //   { NAME: 'Bugs Bunny', AGE: 22 },
    // ]
  });
```

To specify options for `csv`, pass an object argument to the function. For
example:

```js
csv({ separator: '\t' });
```

## API

### csv([options|headers])

Returns: `Array[object]`

#### options

Type: `object`

As an alternative to passing an `options` object, you may pass an `Array[String]`
which specifies the headers to use. For example:

```js
csv(['Name', 'Age']);
```

If you need to specify options _and_ headers, please use the the object notation
with the `headers` property as shown below.

##### escape

Type: `String`<br>
Default: `"`

A single-character string used to specify the character used to escape strings
in a CSV row.

##### headers

Type: `Array[String]`

Specifies the headers to use. Headers define the property key for each value in
a CSV row. If no `headers` option is provided, `csv-parser` will use the first
line in a CSV file as the header specification.

##### mapHeaders

Type: `Function`

A function that can be used to modify the values of each header.

```js
csv({
  mapHeader: (header) => header.toLowerCase();
})
```

##### mapValues

Type: `Function`

A function that can be used to modify the value of each column value.

```js
csv({
  mapHeader: (value) => value.toLowerCase();
})
```

##### newline

Type: `String`<br>
Default: `\n`

Specifies a single-character string to denote the end of a line in a CSV file.

##### quote

Type: `String`<br>
Default: `"`

Specifies a single-character string to denote a quoted string.

##### raw

Type: `Boolean`<br>

If `true`, instructs the parser not to decode UTF-8 strings.

##### separator

Type: `String`<br>
Default: `,`

Specifies a single-character string to use as the column separator for each row.

##### strict

Type: `Boolean`<br>

If `true`, instructs the parser that the number of columns in each row must match
the number of `headers` specified.

## Events

The following events are emitted during parsing:

### `data`

Emitted for each row of data parsed with the notable exception of the header
row. Please see [Usage](#Usage) for an example.

### `headers`

Emitted after the header row is parsed. The first parameter of the event
callback is an `Array[String]` containing the header names.

```js
fs.createReadStream('data.csv')
  .pipe(csv())
  .on('headers', (headers) => {
    console.log(`First header: ${headers[0]}`)
  })
```

### Readable Stream Events

Events available on Node built-in
[Readable Streams](https://nodejs.org/api/stream.html#stream_class_stream_readable)
are also emitted. The `end` event should be used to detect the end of parsing.

## CLI

This module also provides a CLI which will convert CSV to
[newline-delimited](http://ndjson.org/) JSON. The following CLI flags can be
used to control how input is parsed:

```
Usage: csv-parser [filename?] [options]

  --escape,-e         Set the escape character (defaults to quote value)
  --headers,-h        Explicitly specify csv headers as a comma separated list
  --help              Show this help
  --output,-o         Set output file. Defaults to stdout
  --quote,-q          Set the quote character ('"' by default)
  --separator,-s      Set the separator character ("," by default)
  --strict            Require column length match headers length
  --version,-v        Print out the installed version
```

For example; to parse a TSV file:

```
cat data.tsv | csv-parser -s $'\t'
```

## Encoding

Users may encounter issues with the encoding of a CSV file. Transcoding the
source stream can be done neatly with a modules such as:
- [`iconv-lite`](https://www.npmjs.com/package/iconv-lite)
- [`iconv`](https://www.npmjs.com/package/iconv)

Or native [`iconv`](http://man7.org/linux/man-pages/man1/iconv.1.html) if part
of a pipeline.

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING)

[LICENSE (MIT)](./LICENSE)
