var path = require('path')

module.exports = function attorneyPath (capability) {
  return path.join(process.env.DIRECTORY, 'attorney', capability)
}
