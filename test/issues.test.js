const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('backtick separator (#105)', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines, 'lines')
    t.is(lines.length, 2, '2 rows')
    t.end()
  }

  collect('backtick', { separator: '`' }, verify)
})

test.cb('strict + skipLines (#136)', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines, 'lines')
    t.is(lines.length, 3, '4 rows')
    t.end()
  }

  collect('strict+skipLines', { strict: true, skipLines: 1 }, verify)
})

test.cb('raw headers and rows are preserved (#251)', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(lines.length, 2, '2 rows')
    t.true(Buffer.isBuffer(lines[0].a), 'header a is a Buffer')
    t.true(Buffer.isBuffer(lines[0].b), 'header b is a Buffer')
    t.is(lines[0].a.toString(), '1')
    t.is(lines[0].b.toString(), '2')
    t.is(lines[1].a.toString(), '3')
    t.is(lines[1].b.toString(), '4')
    t.end()
  }

  collect('raw-headers', { raw: true }, verify)
})

test.cb('prototype pollution keys are stripped from headers (#250)', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.deepEqual(lines[0], { a: '1', b: '5' }, 'dangerous keys stripped')
    t.false(Object.prototype.hasOwnProperty.call(lines[0], '__proto__'), 'no __proto__ own-property')
    t.false(Object.prototype.hasOwnProperty.call(lines[0], 'constructor'), 'no constructor own-property')
    t.false(Object.prototype.hasOwnProperty.call(lines[0], 'prototype'), 'no prototype own-property')
    t.end()
  }

  collect('prototype-pollution', verify)
})

test.cb('prototype pollution keys are stripped from raw Buffer headers (#250 + #251)', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(Object.keys(lines[0]).length, 2, 'only safe headers survive')
    t.true(Buffer.isBuffer(lines[0].a), 'header a is a Buffer')
    t.true(Buffer.isBuffer(lines[0].b), 'header b is a Buffer')
    t.end()
  }

  collect('prototype-pollution', { raw: true }, verify)
})
