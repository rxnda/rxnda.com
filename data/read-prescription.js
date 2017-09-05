var prescriptionPath = require('./prescription-path')
var readJSONFile = require('./read-json-file')

module.exports = function (configuration, capability, callback) {
  var file = prescriptionPath(configuration, capability)
  readJSONFile(file, function (error, data) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') {
        callback(null, false)
      } else {
        callback(error)
      }
    } else {
      callback(null, data)
    }
  })
}
