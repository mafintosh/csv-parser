const test = require('ava')
const fs = require('fs')
const path = require('path')
const bops = require('bops')
const spectrum = require('csv-spectrum')
const concat = require('concat-stream')
const csv = require('..')

const read = fs.createReadStream
const eol = '\n'

// helpers
function fixture (name) {
  return path.join(__dirname, 'data', name)
}

function collect (file, opts, cb) {
  if (typeof opts === 'function') return collect(file, null, opts)
  const data = read(fixture(file))
  const lines = []
  const parser = csv(opts)
  data
    .pipe(parser)
    .on('data', (line) => {
      lines.push(line)
    })
    .on('error', (err) => {
      cb(err, lines)
    })
    .on('end', () => {
      // eslint-disable-next-line standard/no-callback-literal
      cb(false, lines)
    })
  return parser
}

test.cb('simple csv', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('dummy.csv', verify)
})

test.cb('supports strings', (t) => {
  const parser = csv()

  parser.on('data', (data) => {
    t.snapshot(data)
    t.end()
  })

  parser.write('hello\n')
  parser.write('world\n')
  parser.end()
})

test.cb('newlines in a cell', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'fourth row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('newlines.csv', verify)
})

test.cb('raw escaped quotes', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('escaped_quotes.csv', verify)
})

test.cb('raw escaped quotes and newlines', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('quotes_and_newlines.csv', verify)
})

test.cb('line with comma in quotes', (t) => {
  const headers = bops.from('a,b,c,d,e\n')
  const line = bops.from('John,Doe,120 any st.,"Anytown, WW",08123\n')
  const correct = JSON.stringify({
    a: 'John',
    b: 'Doe',
    c: '120 any st.',
    d: 'Anytown, WW',
    e: '08123'
  })
  const parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', (data) => {
    t.is(JSON.stringify(data), correct)
    t.end()
  })
})

test.cb('line with newline in quotes', (t) => {
  const headers = bops.from('a,b,c\n')
  const line = bops.from(`1,"ha ${eol}""ha"" ${eol}ha",3\n`)
  const correct = JSON.stringify({ a: '1', b: `ha ${eol}"ha" ${eol}ha`, c: '3' })
  const parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', (data) => {
    t.is(JSON.stringify(data), correct)
    t.end()
  })
})

test.cb('cell with comma in quotes', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('"Anytown, WW"\n')
  const correct = 'Anytown, WW'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct)
    t.end()
  })
})

test.cb('cell with newline', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from(`"why ${eol}hello ${eol}there"\n`)
  const correct = `why ${eol}hello ${eol}there`
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct)
    t.end()
  })
})

test.cb('cell with escaped quote in quotes', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('"ha ""ha"" ha"\n')
  const correct = 'ha "ha" ha'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct)
    t.end()
  })
})

test.cb('cell with multibyte character', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('this ʤ is multibyte\n')
  const correct = 'this ʤ is multibyte'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.is(data.a, correct, 'multibyte character is preserved')
    t.end()
  })
})

test.cb('geojson', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    const lineObj = {
      type: 'LineString',
      coordinates: [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]
    }
    t.deepEqual(JSON.parse(lines[1].geojson), lineObj, 'linestrings match')
    t.end()
  }

  collect('test_geojson.csv', verify)
})

test.cb('empty_columns', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    function testLine (row) {
      t.is(Object.keys(row).length, 3, 'Split into three columns')
      t.truthy(/^2007-01-0\d$/.test(row.a), 'First column is a date')
      t.truthy(row.b !== undefined, 'Empty column is in line')
      t.is(row.b.length, 0, 'Empty column is empty')
      t.truthy(row.c !== undefined, 'Empty column is in line')
      t.is(row.c.length, 0, 'Empty column is empty')
    }
    lines.forEach(testLine)
    t.end()
  }

  collect('empty_columns.csv', ['a', 'b', 'c'], verify)
})

test.cb('csv-spectrum', (t) => {
  spectrum((err, data) => {
    if (err) throw err
    let pending = data.length
    data.map((d) => {
      const parser = csv()
      const collector = concat((objs) => {
        t.snapshot(objs, d.name)
        done()
      })
      parser.pipe(collector)
      parser.write(d.csv)
      parser.end()
    })
    function done () {
      pending--
      if (pending === 0) t.end()
    }
  })
})

test.cb('custom newline', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('custom-newlines.csv', { newline: 'X' }, verify)
})

test.cb('optional strict', (t) => {
  const verify = (err, lines) => {
    t.is(err.name, 'RangeError', 'err name')
    t.is(err.message, 'Row length does not match headers', 'strict row length')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.is(lines.length, 2, '2 rows before error')
    t.end()
  }

  collect('test_strict.csv', { strict: true }, verify)
})

test.cb('optional row size limit', (t) => {
  const verify = (err, lines) => {
    t.is(err.message, 'Row exceeds the maximum size', 'strict row size')
    t.is(lines.length, 4576, '4576 rows before error')
    t.end()
  }

  collect('max_row_size.csv', { maxRowBytes: 200 }, verify)
})

test.cb('custom quote character', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.is(lines.length, 2, '2 rows')
    t.end()
  }

  collect('custom_quote_character.csv', { quote: "'" }, verify)
})

test.cb('custom escape character', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('custom_escape_character.csv', { escape: '\\' }, verify)
})

test.cb('custom quote and escape character', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('custom_quote_and_escape_character.csv', { quote: "'", escape: '\\' }, verify)
})

test.cb('custom quote character with default escaped value', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('custom_quote_character_default_escape.csv', { quote: "'" }, verify)
})

test.cb('process all rows', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(lines.length, 7268, '7268 rows')
    t.end()
  }

  collect('process_all_rows.csv', {}, verify)
})

test.cb('skip columns a and c', (t) => {
  const mapHeaders = ({ header, index }) => {
    if (['a', 'c'].indexOf(header) > -1) {
      return null
    }
    return header
  }

  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('dummy.csv', { mapHeaders }, verify)
})

test.cb('rename columns', (t) => {
  const mapHeaders = ({ header, index }) => {
    const headers = { a: 'x', b: 'y', c: 'z' }
    return headers[header]
  }
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('dummy.csv', { mapHeaders }, verify)
})

test.cb('headers: false, numeric column names', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines, 'lines')
    t.is(lines.length, 2, '2 rows')
    t.end()
  }

  collect('dummy.csv', { headers: false }, verify)
})

test.cb('format values', (t) => {
  const headers = []
  const indexes = []
  const mapValues = ({ header, index, value }) => {
    headers.push(header)
    indexes.push(index)
    return parseInt(value, 10)
  }

  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.snapshot(headers, 'headers')
    t.snapshot(indexes, 'indexes')
    t.end()
  }

  collect('dummy.csv', { mapValues }, verify)
})

test.cb('skip rows until', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(JSON.stringify(lines[0]), JSON.stringify({yes: 'ok', yup: 'ok', yeah: 'ok!'}))
    t.end()
  }

  collect('junk_rows.csv', {skipLines: 2}, verify)
})
