var FormData = require('form-data')
var http = require('http')
var sendSimple = require('./send-simple')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Send', function (test) {
  server(function (port, closeServer) {
    sendSimple(webdriver, port)
      .waitForExist('.sent', 20000)
      .getText('h2')
      .then(function (h1Text) {
        test.assert(
          h1Text.includes('Sent!'),
          '<h2> says "Sent!"'
        )
        test.end()
        closeServer()
      })
  })
})

tape.test('invalid send', function (test) {
  server(function (port, closeServer) {
    var form = new FormData()
    form.append('name', 'K')
    http
      .request({
        port: port,
        method: 'POST',
        path: '/send/Testing/1e',
        headers: form.getHeaders()
      })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 400,
          'responds 400'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('send without entity info', function (test) {
  server(function (port, closeServer) {
    var form = new FormData()
    form.append('name', 'K')
    http
      .request({
        port: port,
        method: 'POST',
        path: '/send/RxNDA_N-2W-B2B/1e3d',
        headers: form.getHeaders()
      })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 400,
          'responds 400'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})
