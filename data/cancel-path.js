var path = require('path')

module.exports = function (configuration, capability) {
  return path.join(configuration.directory, 'cancel', capability)
}
