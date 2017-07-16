var path = require('path')

module.exports = function readPrivacyPolicy (configuration, callback) {
  var index = path.resolve(
    path.join(configuration.directory, 'privacy')
  )
  try {
    var forms = require(index)
    callback(null, forms)
  } catch (error) {
    callback(error)
  }
}
