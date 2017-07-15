var path = require('path')

module.exports = function chargePath (configuration, capability) {
  return path.join(configuration.directory, 'charge', capability)
}
