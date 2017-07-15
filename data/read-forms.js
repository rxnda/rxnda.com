var path = require('path')

module.exports = function readForms (configuration, callback) {
  var index = path.resolve(path.join(configuration.directory, 'forms'))
  try {
    var forms = require(index)
    callback(null, forms)
  } catch (error) {
    callback(error)
  }
}
