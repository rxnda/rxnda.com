var fs = require('fs')
var parse = require('json-parse-errback')

module.exports = function (file, callback) {
  fs.readFile(file, ecb(done, function (json) {
    parse(json, callback)
  }))
}
