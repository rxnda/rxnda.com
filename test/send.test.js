var tape = require('tape')
var server = require('./server')
var webdriver = require('./webdriver')
var sendSimple = require('./send-simple')

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
