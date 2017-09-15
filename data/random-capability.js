var sodium = require('sodium-native')

module.exports = function randomCapability (callback) {
  var returned = Buffer.alloc(32)
  sodium.randombytes_buf(returned)
  callback(null, returned.toString('hex'))
}
