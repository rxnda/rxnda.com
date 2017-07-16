var path = require('path')

module.exports = function readTerms (configuration, callback) {
  var index = path.resolve(path.join(configuration.directory, 'terms'))
  try {
    var forms = require(index)
    callback(null, forms)
  } catch (error) {
    callback(error)
  }
}
