var email = require('../email')
var sendSimple = require('./send-simple')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Cancel', function (test) {
  var cancelEMail
  email.events.on('message', function (data) {
    if (data.subject.endsWith('Cancellation Link')) {
      cancelEMail = data
    }
  })
  server(function (port, closeServer) {
    sendSimple(webdriver, port)
      .waitForExist('.sent', 20000)
      .then(function () {
        return webdriver.url(
          'http://localhost:' + port + '/cancel/' +
          /([a-f0-9]{64})/.exec(cancelEMail.html)[1]
        )
      })
      .waitForExist('input[type=submit]')
      .click('input[type=submit]')
      .waitForExist('.canceled')
      .getText('h2')
      .then(function (h1Text) {
        test.assert(
          h1Text.includes('Canceled!'),
          '<h2> says "Canceled!"'
        )
        test.end()
        closeServer()
      })
  })
})
