var path = require('path')

module.exports = function signPath (capability) {
  return path.join(process.env.DIRECTORY, 'sign', capability)
}
