var elide = require('./data/elide')

// Shim the Mailgun send function and export an EventEmitter
// tests can use to check invocations.
/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (configuration, message, callback) {
    var log = configuration.log.child({subsystem: 'email'})
    log.info(elide(message, 'docx', 'pdf', 'ics'))
    events.emit('message', message)
    callback()
  }
  module.exports.events = events
} else {
  var FormData = require('form-data')
  var https = require('https')
  var pump = require('pump')
  var DOCX = require('docx-content-type')
  module.exports = function (configuration, message, callback) {
    var domain = configuration.email.domain
    var key = configuration.email.key
    var from = configuration.email.sender + '@' + domain
    var log = configuration.log.child({subsystem: 'email'})
    log.info(elide(message, 'docx', 'pdf', 'ics'))
    var form = new FormData()
    form.append('from', from)
    form.append('to', message.to)
    if (message.cc) {
      form.append('cc', message.cc)
    }
    form.append('subject', message.subject)
    form.append('o:dkim', 'yes')
    form.append('o:require-tls', 'yes')
    if (message.text) {
      form.append('text', message.text)
    }
    if (message.html) {
      form.append('html', message.html)
    }
    if (message.docx) {
      form.append('attachment', message.docx.data, {
        filename: message.docx.name,
        contentType: DOCX,
        knownLength: message.docx.data.length
      })
    }
    if (message.pdf) {
      form.append('attachment', message.pdf.data, {
        filename: message.pdf.name,
        contentType: 'application/pdf',
        knownLength: message.pdf.data.length
      })
    }
    if (message.ics) {
      form.append('attachment', message.ics, {
        filename: 'expiration.ics',
        contentType: 'text/calendar',
        knownLength: message.ics.length
      })
    }
    pump(form, https.request({
      method: 'POST',
      host: 'api.mailgun.net',
      path: '/v3/' + domain + '/messages',
      auth: 'api:' + key,
      headers: form.getHeaders()
    }, function (response) {
      var status = response.statusCode
      if (status === 200) {
        log.info({event: 'sent'})
        callback()
      } else {
        response
          .once('error', function (error) {
            log.error(error)
            callback(error)
          })
          .pipe(require('concat-stream')(function (body) {
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
