var signatureProperties = require('./signature-properties')

module.exports = function validSignatureProperty (name) {
  return signatureProperties.includes(name)
}
