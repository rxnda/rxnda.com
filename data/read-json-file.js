var ecb = require('ecb')
var fs = require('fs')
var parse = require('json-parse-errback')

module.exports = function readJSONFile (file, callback) {
  fs.readFile(file, ecb(callback, function (json) {
    parse(json, callback)
  }))
}
