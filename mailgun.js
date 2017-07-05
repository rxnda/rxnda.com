// Shim the Mailgun send function and export an EventEmitter
// tests can use to check invocations.
/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (configuration, message, callback) {
    var log = configuration.log.child({subsystem: 'mailgun'})
    log.info(message)
    events.emit('message', message)
    callback()
  }
  module.exports.events = events
} else {
  var FormData = require('form-data')
  var https = require('https')
  var pump = require('pump')
  module.exports = function (configuration, message, callback) {
    var domain = configuration.mailgun.domain
    var key = configuration.mailgun.key
    var from = 'notifications@' + domain
    var log = configuration.log.child({subsystem: 'mailgun'})
    log.info(message)
    var form = new FormData()
    form.append('from', from)
    form.append('to', message.to)
    form.append('subject', message.subject)
    form.append('text', message.text)
    var options = {
      method: 'POST',
      host: 'api.mailgun.net',
      path: '/v3/' + domain + '/messages',
      auth: 'api:' + key,
      headers: form.getHeaders()
    }
    pump(form, https.request(options, function (response) {
      var status = response.statusCode
      if (status === 200) {
        log.info({event: 'sent'})
        callback()
      } else {
        var buffers = []
        response
          .on('data', function (buffer) {
            buffers.push(buffer)
          })
          .once('error', function (error) {
            callback(error)
          })
          .once('end', function () {
            var body = Buffer.concat(buffers).toString()
            var error = {
              status: response.statusCode,
              body: body
            }
            log.error(error)
            callback(error)
          })
      }
    }))
  }
}