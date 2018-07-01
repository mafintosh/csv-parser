var test = require('tape')
var fs = require('fs')
var path = require('path')
var csvPromise = require('../promise')

test('simple csv with promise', function (t) {
  csvPromise(fs.createReadStream(path.join(__dirname, 'data', 'dummy.csv')))
    .then(function (lines) {
      t.same(lines[0], {a: '1', b: '2', c: '3'}, 'first row')
      t.equal(lines.length, 1, '1 row')
      t.end()
    })
    .catch(function (err) {
      t.false(err, 'no err')
    })
})
