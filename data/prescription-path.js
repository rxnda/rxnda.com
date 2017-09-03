var path = require('path')

module.exports = function prescriptionPath (configuration, capability) {
  return path.join(configuration.directory, 'prescription', capability)
}
