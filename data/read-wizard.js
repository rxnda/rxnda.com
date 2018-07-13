var path = require('path')

module.exports = function readWizard (callback) {
  var index = path.resolve(path.join(process.env.DIRECTORY, 'wizard'))
  try {
    var wizard = require(index)
    callback(null, wizard)
  } catch (error) {
    // istanbul ignore next
    callback(error)
  }
}
