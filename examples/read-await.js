var parse = require('../');
var path = require('path');
var fs = require('fs');

(async () => {
  const s = fs.createReadStream(path.join(__dirname, '../test/data/dummy.csv')).pipe(parse());
  const rows = [];
  for await (const row of s) {
    rows.push(row);
  }
  console.log(rows);
})()
  .catch(console.error);
