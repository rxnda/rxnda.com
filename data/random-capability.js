var readRandom = require('read-random')

module.exports = function randomCapability (callback) {
  readRandom(32, function (error, bytes) {
    if (error) return callback(error)
    callback(null, bytes.toString('hex'))
  })
}
