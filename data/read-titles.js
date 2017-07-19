var fs = require('fs')
var path = require('path')

module.exports = function (configuration, callback) {
  var directory = path.join(configuration.directory, 'forms')
  fs.readdir(directory, function (error, files) {
    /* istanbul ignore if */
    if (error) {
      if (error.code === 'ENOENT') {
        callback(null, false)
      } else {
        callback(error)
      }
    } else {
      callback(null, files.sort())
    }
  })
}
