var path = require('path')

module.exports = function readTerms (callback) {
  var index = path.resolve(path.join(process.env.DIRECTORY, 'terms'))
  try {
    var forms = require(index)
    callback(null, forms)
  } catch (error) {
    // istanbul ignore next
    callback(error)
  }
}
