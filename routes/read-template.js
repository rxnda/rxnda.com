var fs = require('fs')
var path = require('path')

module.exports = function readTemplate (file, callback) {
  return fs.createReadStream(
    path.join(__dirname, '..', 'templates', file)
  )
}
