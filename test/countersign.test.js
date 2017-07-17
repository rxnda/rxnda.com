var email = require('../email')
var sendSimple = require('./send-simple')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Countersign', function (test) {
  var signEMail
  email.events.on('message', function (data) {
    if (data.subject && data.subject.indexOf('NDA Offer') === 0) {
      signEMail = data
    }
  })
  server(function (port, closeServer) {
    sendSimple(webdriver, port)
      .waitForExist('.sent', 20000)
      .then(function () {
        return webdriver.url(
          'http://localhost:' + port + '/countersign/' +
          /([a-f0-9]{64})/.exec(signEMail.text)[1]
        )
      })
      .waitForExist('input[name="signatures-recipient-name"]', 20000)
      .setValue(
        'input[name="signatures-recipient-name"]',
        'Bob'
      )
      .setValue(
        'input[name="signatures-recipient-signature"]',
        'Bob'
      )
      .setValue(
        'input[name="signatures-recipient-company"]',
        'SomeCo'
      )
      .setValue(
        'input[name="signatures-recipient-jurisdiction"]',
        'California'
      )
      .setValue(
        'input[name="signatures-recipient-form"]',
        'corporation'
      )
      .setValue(
        'input[name="signatures-recipient-title"]',
        'CEO'
      )
      .setValue(
        'textarea[name="signatures-recipient-address"]',
        'Neverland'
      )
      .click('input[name=terms]')
      .click('input[type=submit]')
      .waitForExist('.agreed')
      .getText('h2')
      .then(function (h1Text) {
        test.assert(
          h1Text.includes('Agreed!'),
          '<h2> says "Agreed!"'
        )
        test.end()
        closeServer()
      })
  })
})
