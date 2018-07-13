var path = require('path')

module.exports = function prescriptionPath (capability) {
  return path.join(process.env.DIRECTORY, 'prescription', capability)
}
