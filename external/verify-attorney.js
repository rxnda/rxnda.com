if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (number, email, callback) {
    setImmediate(function () {
      var match = email === 'valid@example.com'
      var active = number === '111111'
      events.emit('request', number, email)
      callback(null, match, active)
    })
  }
  module.exports.events = events
} else {
  module.exports = require('validate-california-attorney-email')
}
