// subscribe(log...

// Shim the Mailgun send function and export an EventEmitter
// tests can use to check invocations.
/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (requestLog, list, address, subscribed, callback) {
    var log = requestLog.log.child({subsystem: 'subscribe'})
    var item = {list: list, address: address}
    log.info(item)
    events.emit('add', item)
    callback()
  }
  module.exports.events = events
} else {
  var FormData = require('form-data')
  var https = require('https')
  var pump = require('pump')
  var concat = require('concat-stream')
  module.exports = function (requestLog, list, address, callback) {
    var key = process.env.MAILGUN_KEY
    var form = new FormData()
    var log = requestLog.log.child({subsystem: 'subscribe'})
    log.info({list: list, address: address})
    form.append('subscribed', 'yes')
    form.append('upsert', 'yes')
    form.append('address', address)
    pump(form, https.request({
      method: 'POST',
      host: 'api.mailgun.net',
      path: `/v3/lists/${list}/members`,
      auth: 'api:' + key,
      headers: form.getHeaders()
    }, function (response) {
      var status = response.statusCode
      if (status === 200) {
        log.info({event: 'subscribed'})
        callback()
      } else {
        response
          .once('error', function (error) {
            log.error(error)
            callback(error)
          })
          .pipe(concat(function (body) {
            var error = {
              status: response.statusCode,
              body: body.toString()
            }
            log.error(error)
            callback(error)
          }))
      }
    }))
  }
}
