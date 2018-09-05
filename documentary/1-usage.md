
## Usage

Simply instantiate `csv` and pump a csv file to it and get the rows out as objects

You can use `csv-parser` in the browser with [browserify](http://browserify.org/)

Let's say that you have a CSV file ``some-csv-file.csv`` like this:

%EXAMPLE: example/some-csv-file.csv%

You can parse it like this:

%EXAMPLE: example/parse.js, .. => csv-parser%

%FORK example/parse%

The data emitted is a normalized JSON object. Each header is used as the property name of the object.

The csv constructor accepts the following options as well

%EXAMPLE: example/constructor.js%

It accepts too an array, that specifies the headers for the object returned:

%EXAMPLE: example/array.js, .. => csv-parser%

%FORK example/array%

or in the option object as well

%EXAMPLE: example/array-options.js%

If you do not specify the headers, csv-parser will take the first line of the csv and treat it like the headers.

Another issue might be the encoding of the source file. Transcoding the source stream can be done neatly with something like [`iconv-lite`](https://www.npmjs.com/package/iconv-lite), Node bindings to [`iconv`](https://www.npmjs.com/package/iconv) or native [`iconv`](http://man7.org/linux/man-pages/man1/iconv.1.html) if part of a pipeline.
