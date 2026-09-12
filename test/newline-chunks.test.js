const test = require('ava')
const csv = require('..')

function parse (chunks, options) {
  return new Promise((resolve, reject) => {
    const parser = csv(options)
    const rows = []
    let headers
    parser.on('headers', (value) => { headers = value })
    parser.on('data', (row) => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve({ headers, rows }))
    for (const chunk of chunks) parser.write(Buffer.from(chunk))
    parser.end()
  })
}

test('CRLF detection waits for the next chunk (#234)', async (t) => {
  const expected = { headers: ['foo'], rows: [{ foo: 'bar' }, { foo: 'baz' }] }
  t.deepEqual(await parse(['foo\r\nbar\r\nbaz\r\n']), expected)
  t.deepEqual(await parse(['foo\r', '\nbar\r\n', 'baz\r\n']), expected)
})

test('CRLF records and byte offsets do not depend on chunk boundaries', async (t) => {
  const input = 'name,value\r\nCleo,1\r\nPancakes,2\r\n'
  const options = { outputByteOffset: true, strict: true }
  const expected = {
    headers: ['name', 'value'],
    rows: [
      { row: { name: 'Cleo', value: '1' }, byteOffset: 12 },
      { row: { name: 'Pancakes', value: '2' }, byteOffset: 20 }
    ]
  }
  for (const split of [4, 11, 12, 19]) {
    t.deepEqual(await parse([input.slice(0, split), input.slice(split)], options), expected)
  }
  t.deepEqual(await parse(input.split(''), options), expected)
})

test('empty chunks do not resolve a pending CR', async (t) => {
  t.deepEqual(await parse(['foo\r', '', '', '\nbar']), {
    headers: ['foo'], rows: [{ foo: 'bar' }]
  })
})

test('standalone CR is detected when the next byte arrives', async (t) => {
  t.deepEqual(await parse(['foo\r', 'bar\r', 'baz\r']), {
    headers: ['foo'], rows: [{ foo: 'bar' }, { foo: 'baz' }]
  })
})

test('EOF handles a pending CR and an unterminated final row', async (t) => {
  t.deepEqual(await parse(['foo\r']), { headers: ['foo'], rows: [] })
  t.deepEqual(await parse(['foo']), { headers: ['foo'], rows: [] })
  for (const ending of ['', '\r', '\r\n']) {
    t.deepEqual(await parse(['foo\r', `\nbar${ending}`]), {
      headers: ['foo'], rows: [{ foo: 'bar' }]
    })
  }
})

test('LF and explicit custom newline behavior is preserved', async (t) => {
  for (const newline of ['\n', '\r', 'X']) {
    t.deepEqual(await parse([`foo${newline}`, `bar${newline}`], { newline }), {
      headers: ['foo'], rows: [{ foo: 'bar' }]
    })
  }
})

test('quoted CRLF stays in the header and field', async (t) => {
  t.deepEqual(await parse(['"fo\r', '\no"\r', '\n"bar\r', '\nbaz"\r', '\n']), {
    headers: ['fo\r\no'], rows: [{ 'fo\r\no': 'bar\r\nbaz' }]
  })
})

test('skipped lines and comments can end with a split CRLF', async (t) => {
  t.deepEqual(await parse(['skip\r', '\nfoo\r', '\nbar\r\n'], { skipLines: 1 }), {
    headers: ['foo'], rows: [{ foo: 'bar' }]
  })
  t.deepEqual(await parse(['#comment\r', '\nfoo\r', '\nbar\r\n'], { skipComments: true }), {
    headers: ['foo'], rows: [{ foo: 'bar' }]
  })
})

test('a deferred CR counts once towards maxRowBytes', async (t) => {
  const chunks = ['foo\r', '\nbar\r\n']
  t.deepEqual(await parse(chunks, { maxRowBytes: 5 }), {
    headers: ['foo'], rows: [{ foo: 'bar' }]
  })
  await t.throwsAsync(parse(chunks, { maxRowBytes: 4 }), { message: 'Row exceeds the maximum size' })
  await t.throwsAsync(parse(['foo\r'], { maxRowBytes: 3 }), { message: 'Row exceeds the maximum size' })
})
