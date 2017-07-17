var path = require('path')
var readJSONFile = require('./read-json-file')

module.exports = function (configuration, title, edition, callback) {
  var file = path.join(
    configuration.directory, 'forms', title,
    edition + '.json'
  )
  readJSONFile(file, function (error, data) {
    if (error) {
      if (error.code === 'ENOENT') {
        callback(null, false)
      } else {
        callback(error)
      }
    } else {
      data.edition = edition
      data.title = title
      callback(null, data)
    }
  })
}
