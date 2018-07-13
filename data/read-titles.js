var fs = require('fs')
var path = require('path')

module.exports = function (callback) {
  var directory = path.join(process.env.DIRECTORY, 'forms')
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
