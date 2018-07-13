var fs = require('fs')
var path = require('path')

module.exports = function (title, callback) {
  var directory = path.join(process.env.DIRECTORY, 'forms', title)
  fs.readdir(directory, function (error, files) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return callback(null, false)
      return callback(error)
    }
    callback(
      null,
      files.map(function (element) {
        return element.replace(/\.json$/, '')
      })
    )
  })
}
