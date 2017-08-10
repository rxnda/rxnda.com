var email = require('../email')
var sendSimple = require('./send-simple')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('View', function (test) {
  var signEMail
  email.events.on('message', function (data) {
    if (data.subject && data.subject.startsWith('NDA')) {
      signEMail = data
    }
  })
  server(function (port, closeServer) {
    sendSimple(webdriver, port)
      .waitForExist('.sent', 20000)
      .then(function () {
        return webdriver.url(
          'http://localhost:' + port + '/view/' +
          /([a-f0-9]{64})/.exec(signEMail.html)[1]
        )
      })
      .waitForExist('.commonform', 20000)
      .isExisting('//p[contains(text(), "This is not a very good NDA.")]')
      .then(function (exists) {
        test.assert(
          exists,
          'shows form text'
        )
        test.end()
        closeServer()
      })
  })
})
