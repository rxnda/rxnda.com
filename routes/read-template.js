var path = require('path')
var fs = require('fs')

module.exports = function (file, callback) {
  fs.readFile(
    path.join(__dirname, '..', 'templates', file),
    'utf8',
    callback
  )
}
