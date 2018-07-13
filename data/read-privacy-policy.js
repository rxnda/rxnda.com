var path = require('path')

module.exports = function readPrivacyPolicy (callback) {
  var index = path.resolve(
    path.join(process.env.DIRECTORY, 'privacy')
  )
  try {
    var forms = require(index)
    callback(null, forms)
  } catch (error) {
    // istanbul ignore next
    callback(error)
  }
}
