var htmlEntities = require('html-entities').Html4Entities

module.exports = function escape (string) {
  return htmlEntities.encodeNonASCII(string)
}
