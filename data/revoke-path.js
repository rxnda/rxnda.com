var path = require('path')

module.exports = function cancelPath (capability) {
  return path.join(process.env.DIRECTORY, 'revoke', capability)
}
