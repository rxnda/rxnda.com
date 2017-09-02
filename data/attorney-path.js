var path = require('path')

module.exports = function attorneyPath (configuration, capability) {
  return path.join(configuration.directory, 'attorney', capability)
}
