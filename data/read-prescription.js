var prescriptionPath = require('./prescription-path')
var readJSONFile = require('./read-json-file')

module.exports = function (capability, callback) {
  var file = prescriptionPath(capability)
  readJSONFile(file, function (error, data) {
    if (error) {
      /* istanbul ignore else */
      if (error.code === 'ENOENT') return callback(null, false)
      return callback(error)
    }
    callback(null, data)
  })
}
