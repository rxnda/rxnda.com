var fs = require('fs')
var path = require('path')

module.exports = function (configuration, title, callback) {
  var directory = path.join(configuration.directory, 'forms', title)
  fs.readdir(directory, function (error, files) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        callback(null, false)
      } else {
        callback(error)
      }
    } else {
      callback(
        null,
        files.map(function (element) {
          return element.replace(/\.json$/, '')
        })
      )
    }
  })
}
