var ed25519 = require('../ed25519')

module.exports = function (capability, recipient) {
  var signature = ed25519.sign(
    capability + ' ' + recipient,
    Buffer.from(process.env.PUBLIC_KEY, 'hex'),
    Buffer.from(process.env.PRIVATE_KEY, 'hex')
  ).toString('hex')
  return (
    signature.slice(0, 32) + '\n' +
    signature.slice(32, 64) + '\n' +
    signature.slice(64, 96) + '\n' +
    signature.slice(96)
  )
}
