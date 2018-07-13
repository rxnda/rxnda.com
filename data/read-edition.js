var path = require('path')
var readJSONFile = require('./read-json-file')

module.exports = function (title, edition, callback) {
  var file = path.join(
    process.env.DIRECTORY, 'forms', title,
    edition + '.json'
  )
  readJSONFile(file, function (error, data) {
    if (error) {
      /* istanbul ignore else */
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
