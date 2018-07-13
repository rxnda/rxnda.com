var path = require('path')

module.exports = function chargePath (capability) {
  return path.join(process.env.DIRECTORY, 'charge', capability)
}
