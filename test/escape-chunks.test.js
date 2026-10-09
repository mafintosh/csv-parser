const test = require('ava')
const csv = require('..')

function parse (chunks, options) {
  return new Promise((resolve, reject) => {
    const parser = csv(options)
    const rows = []
    parser.on('data', (row) => rows.push(row))
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
    for (const chunk of chunks) parser.write(Buffer.from(chunk))
    parser.end()
  })
}

// 2026-10-10: Escaped quotes must keep multiline fields intact across chunks.
test('custom escape and quote may arrive in separate chunks', async (t) => {
  for (const quote of ['"', "'"]) {
    const input = `name,value\n${quote}a\\${quote}b\nc${quote},1\nlast,2\n`
    const options = { quote, escape: '\\', outputByteOffset: true }
    const expected = [
      { row: { name: `a${quote}b\nc`, value: '1' }, byteOffset: 11 },
      { row: { name: 'last', value: '2' }, byteOffset: input.indexOf('last') }
    ]
    for (let split = 1; split < input.length; split++) {
      t.deepEqual(await parse([input.slice(0, split), input.slice(split)], options), expected)
    }
    t.deepEqual(await parse(input.split(''), options), expected)
    const split = input.indexOf('\\') + 1
    t.deepEqual(await parse([input.slice(0, split), '', input.slice(split)], options), expected)
  }
})

// 2026-10-10: The same boundary can occur while parsing a quoted header.
test('custom escapes in headers are independent of chunk boundaries', async (t) => {
  const input = '"a\\"b\nc",value\n1,2\n'
  const expected = [{ 'a"b\nc': '1', value: '2' }]
  const options = { escape: '\\' }
  for (let split = 1; split < input.length; split++) {
    t.deepEqual(await parse([input.slice(0, split), input.slice(split)], options), expected)
  }
  t.deepEqual(await parse(input.split(''), options), expected)
})

// 2026-10-10: Default doubled-quote escaping still works one byte at a time.
test('doubled quote escapes retain their existing chunk behavior', async (t) => {
  const input = 'name\n"a""b\nc"\n'
  t.deepEqual(await parse(input.split('')), [{ name: 'a"b\nc' }])
})
