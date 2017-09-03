var path = require('path')

module.exports = function signPath (configuration, capability) {
  return path.join(configuration.directory, 'fill', capability)
}
