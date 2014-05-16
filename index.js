var stream = require('stream');
var util = require('util');
var gen = require('generate-object-property');

var Parser = function(raw) {
	stream.Transform.call(this, {objectMode:true});
	this.headers = null;
	this._prev = null;
	this._prevEnd = 0;
	this._nlbyte = 10;
	this._first = true;
	this._raw = !!raw;
	this._Row = null;
};

util.inherits(Parser, stream.Transform);

Parser.prototype._write = function(data, enc, cb) {
	var start = 0;
	var buf = data;

	if (this._prev) {
		start = this._prev.length;
		buf = Buffer.concat([this._prev, data]);
		this._prev = null;
	}

	for (var i = start; i < buf.length; i++) {
		if (buf[i] === this._nlbyte) {
			this._online(buf, this._prevEnd, i+1);
			this._prevEnd = i+1;
		}
	}

	if (this._prevEnd === buf.length) {
		return cb();
	}

	if (buf.length - this._prevEnd < data.length) {
		this._prev = data;
		this._prevEnd -= (buf.length - data.length);
		return cb();
	}

	this._prev = buf;
	cb();
};

var quote = new Buffer('"')[0] // 22
var comma = new Buffer(',')[0] // 22

Parser.prototype._online = function(buf, start, end) {
	end -= 1; // trim newline

	var cells = []
	var inQuotes = false
	var offset = start

	for (var i = start; i < end; i++) {
		if (buf[i] === quote) { // "
			if (i < end-1 && buf[i + 1] === quote) { // ""
				i++
			} else {
				inQuotes = !inQuotes
			}
			continue
		}
		if (buf[i] === comma && !inQuotes) {
			cells.push(this._oncell(buf, offset, i))
			offset = i + 1
		}
	}
	if (offset < end) cells.push(this._oncell(buf, offset, end))
	if (buf[end-1] === comma) cells.push(new Buffer(0))

	if (this._first) {
		this._first = false;
		this.headers = cells;
		this._compile(cells);
		this.emit('headers', this.headers);
		return;
	}

	this._emit(this._Row, cells);
};

Parser.prototype._compile = function() {
	if (this._Row) return;

	var props = this.headers.map(function(cell, i) {
		return '\t'+gen('this', cell)+' = cells['+i+'];'
	}).join('\n')+'\n';

	this._Row = new Function('return function Row(cells) {\n'+props+'}')();
};

Parser.prototype._emit = function(Row, cells) {
	this.push(new Row(cells));
};

Parser.prototype._oncell = function(buf, start, end) {
	if (buf[start] === quote && buf[end - 1] === quote) {
		start++
		end--
	}

	for (var i = start, y = start; i < end; i++) {
		if (buf[i] === quote && buf[i + 1] === quote) i++
		if (y !== i) buf[y] = buf[i]
		y++
	}

	return this._onvalue(buf, start, y)
};

Parser.prototype._onvalue = function(buf, start, end) {
	if (this._raw) return buf.slice(start, end);
	return buf.toString('utf-8', start, end);
};

module.exports = function() {
	return new Parser();
};

if (require.main !== module) return;

var now = Date.now();
var fs = require('fs');
fs.createReadStream('/tmp/tmp.csv')
	.pipe(new Parser())
	.on('data', function(line) {
		console.log(line)
	})
	.on('end', function() {
		console.log(Date.now() - now);
	})