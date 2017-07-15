var path = require('path')

module.exports = function readWizard (configuration, callback) {
  var index = path.resolve(path.join(configuration.directory, 'wizard'))
  try {
    var wizard = require(index)
    callback(null, wizard)
  } catch (error) {
    callback(error)
  }
}
