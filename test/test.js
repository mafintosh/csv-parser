const test = require('tape')
const fs = require('fs')
const path = require('path')
const eol = require('os').EOL
const bops = require('bops')
const spectrum = require('csv-spectrum')
const concat = require('concat-stream')
const csv = require('..')
const read = fs.createReadStream

test('simple csv', (t) => {
  collect('dummy.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: '2', c: '3' }, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

test('supports strings', (t) => {
  const parser = csv()

  parser.on('data', (data) => {
    t.same(data, { hello: 'world' })
    t.end()
  })

  parser.write('hello\n')
  parser.write('world\n')
  parser.end()
})

test('newlines in a cell', (t) => {
  collect('newlines.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: '2', c: '3' }, 'first row')
    t.same(lines[1], { a: `Once upon ${eol}a time`, b: '5', c: '6' }, 'second row')
    t.same(lines[2], { a: '7', b: '8', c: '9' }, 'fourth row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('raw escaped quotes', (t) => {
  collect('escaped_quotes.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: 'ha "ha" ha' }, 'first row')
    t.same(lines[1], { a: '2', b: '""' }, 'second row')
    t.same(lines[2], { a: '3', b: '4' }, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('raw escaped quotes and newlines', (t) => {
  collect('quotes_and_newlines.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: `ha ${eol}"ha" ${eol}ha` }, 'first row')
    t.same(lines[1], { a: '2', b: ` ${eol}"" ${eol}` }, 'second row')
    t.same(lines[2], { a: '3', b: '4' }, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('line with comma in quotes', (t) => {
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
    t.equal(JSON.stringify(data), correct)
    t.end()
  })
})

test('line with newline in quotes', (t) => {
  const headers = bops.from('a,b,c\n')
  const line = bops.from(`1,"ha ${eol}""ha"" ${eol}ha",3\n`)
  const correct = JSON.stringify({ a: '1', b: `ha ${eol}"ha" ${eol}ha`, c: '3' })
  const parser = csv()

  parser.write(headers)
  parser.write(line)
  parser.end()

  parser.once('data', (data) => {
    t.equal(JSON.stringify(data), correct)
    t.end()
  })
})

test('cell with comma in quotes', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('"Anytown, WW"\n')
  const correct = 'Anytown, WW'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.equal(data.a, correct)
    t.end()
  })
})

test('cell with newline', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from(`"why ${eol}hello ${eol}there"\n`)
  const correct = `why ${eol}hello ${eol}there`
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.equal(data.a, correct)
    t.end()
  })
})

test('cell with escaped quote in quotes', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('"ha ""ha"" ha"\n')
  const correct = 'ha "ha" ha'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.equal(data.a, correct)
    t.end()
  })
})

test('cell with multibyte character', (t) => {
  const headers = bops.from('a\n')
  const cell = bops.from('this ʤ is multibyte\n')
  const correct = 'this ʤ is multibyte'
  const parser = csv()

  parser.write(headers)
  parser.write(cell)
  parser.end()

  parser.once('data', (data) => {
    t.equal(data.a, correct, 'multibyte character is preserved')
    t.end()
  })
})

test('geojson', (t) => {
  collect('test_geojson.csv', verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    const lineObj = {
      type: 'LineString',
      coordinates: [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]
    }
    t.same(JSON.parse(lines[1].geojson), lineObj, 'linestrings match')
    t.end()
  }
})

test('empty_columns', (t) => {
  collect('empty_columns.csv', ['a', 'b', 'c'], verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    function testLine (row) {
      t.equal(Object.keys(row).length, 3, 'Split into three columns')
      t.ok(/^2007-01-0\d$/.test(row.a), 'First column is a date')
      t.ok(row.b !== undefined, 'Empty column is in line')
      t.equal(row.b.length, 0, 'Empty column is empty')
      t.ok(row.c !== undefined, 'Empty column is in line')
      t.equal(row.c.length, 0, 'Empty column is empty')
    }
    lines.forEach(testLine)
    t.end()
  }
})

test('csv-spectrum', (t) => {
  spectrum((err, data) => {
    if (err) throw err
    let pending = data.length
    data.map((d) => {
      const parser = csv()
      const collector = concat((objs) => {
        const expected = JSON.parse(d.json)
        t.same(objs, expected, d.name)
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

test('custom newline', (t) => {
  collect('custom-newlines.csv', { newline: 'X' }, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: '2', c: '3' }, 'first row')
    t.same(lines[1], { a: 'X-Men', b: '5', c: '6' }, 'second row')
    t.same(lines[2], { a: '7', b: '8', c: '9' }, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('optional strict', (t) => {
  collect('test_strict.csv', { strict: true }, verify)
  function verify (err, lines) {
    t.equal(err.message, 'Row length does not match headers', 'strict row length')
    t.same(lines[0], { a: '1', b: '2', c: '3' }, 'first row')
    t.same(lines[1], { a: '4', b: '5', c: '6' }, 'second row')
    t.equal(lines.length, 2, '2 rows before error')
    t.end()
  }
})

test('custom quote character', (t) => {
  collect('custom_quote_character.csv', { quote: "'" }, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: 'some value', c: '2' }, 'first row')
    t.same(lines[1], { a: '3', b: '4', c: '5' }, 'second row')
    t.equal(lines.length, 2, '2 rows')
    t.end()
  }
})

test('custom escape character', (t) => {
  collect('custom_escape_character.csv', { escape: '\\' }, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: 'some "escaped" value', c: '2' }, 'first row')
    t.same(lines[1], { a: '3', b: '""', c: '4' }, 'second row')
    t.same(lines[2], { a: '5', b: '6', c: '7' }, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('custom quote and escape character', (t) => {
  collect('custom_quote_and_escape_character.csv', { quote: "'", escape: '\\' }, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: "some 'escaped' value", c: '2' }, 'first row')
    t.same(lines[1], { a: '3', b: "''", c: '4' }, 'second row')
    t.same(lines[2], { a: '5', b: '6', c: '7' }, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('custom quote character with default escaped value', (t) => {
  collect('custom_quote_character_default_escape.csv', { quote: "'" }, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: '1', b: "some 'escaped' value", c: '2' }, 'first row')
    t.same(lines[1], { a: '3', b: "''", c: '4' }, 'second row')
    t.same(lines[2], { a: '5', b: '6', c: '7' }, 'third row')
    t.equal(lines.length, 3, '3 rows')
    t.end()
  }
})

test('process all rows', (t) => {
  collect('process_all_rows.csv', {}, verify)
  function verify (err, lines) {
    t.false(err, 'no err')
    t.equal(lines.length, 7268, '7268 rows')
    t.end()
  }
})

test('skip columns a and c', (t) => {
  collect('dummy.csv', { mapHeaders }, verify)
  function mapHeaders (name, i) {
    if (['a', 'c'].indexOf(name) > -1) {
      return null
    }
    return name
  }
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { b: '2' }, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

test('rename columns', (t) => {
  collect('dummy.csv', { mapHeaders }, verify)
  function mapHeaders (name, i) {
    const headers = { a: 'x', b: 'y', c: 'z' }
    return headers[name]
  }
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { x: '1', y: '2', z: '3' }, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

test('format values', (t) => {
  collect('dummy.csv', { mapValues }, verify)
  function mapValues (v) {
    return parseInt(v, 10)
  }
  function verify (err, lines) {
    t.false(err, 'no err')
    t.same(lines[0], { a: 1, b: 2, c: 3 }, 'first row')
    t.equal(lines.length, 1, '1 row')
    t.end()
  }
})

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
