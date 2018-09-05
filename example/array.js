var csv = require('..')
var s = require('stream')
var Readable = s.Readable

var origin = new Readable({
  read: function () {
    this.push('12312,Hello World')
    this.push(null)
  }
})
/* start example */
var stream = csv(['index', 'message'])

// Source from somewhere with format 12312,Hello World
origin.pipe(stream)
  .on('data', function (data) {
    console.log(data)
  })
/* end example */
