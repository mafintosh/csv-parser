
## Command Line Tool

There is also a command line tool available. It will convert csv to line delimited JSON.

```
npm install -g csv-parser
```

Open a shell and run

```
$ csv-parser --help # prints all options
$ printf "a,b\nc,d\n" | csv-parser # parses input
```

### Options

You can specify these CLI flags to control how the input is parsed:

%FORKERR bin --help%

For example, to parse a TSV file:

```
cat data.tsv | csv-parser -s $'\t'
```
