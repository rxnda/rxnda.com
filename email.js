// Shim the Mailgun send function and export an EventEmitter
// tests can use to check invocations.
/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  var EventEmitter = require('events').EventEmitter
  var events = new EventEmitter()
  module.exports = function (configuration, message, callback) {
    var log = configuration.log.child({subsystem: 'email'})
    log.info(elide(message, 'docx'))
    events.emit('message', message)
    callback()
  }
  module.exports.events = events
} else {
  var FormData = require('form-data')
  var https = require('https')
  var pump = require('pump')
  module.exports = function (configuration, message, callback) {
    var domain = configuration.email.domain
    var key = configuration.email.key
    var from = configuration.email.sender + '@' + domain
    var log = configuration.log.child({subsystem: 'email'})
    log.info(elide(message, 'docx'))
    var form = new FormData()
    form.append('from', from)
    form.append('to', message.to)
    form.append('subject', message.subject)
    form.append('text', message.text)
    if (message.docx) {
      form.append('attachment', message.docx.data, {
        filename: message.docx.name,
        contentType: (
          'application/' +
          'vnd.openxmlformats-officedocument.wordprocessingml.document'
        ),
        knownLength: message.docx.data.length
      })
    }
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

function elide () {
  var args = Array.prototype.slice.call(arguments)
  var object = args[0]
  var drop = args.slice(1)
  var returned = {}
  Object.keys(object).forEach(function (key) {
    if (drop.includes(key)) {
      returned[key] = 'ELIDED'
    } else {
      returned[key] = object[key]
    }
  })
  return returned
}
