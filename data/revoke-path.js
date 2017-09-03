var path = require('path')

module.exports = function cancelPath (configuration, capability) {
  return path.join(configuration.directory, 'revoke', capability)
}
