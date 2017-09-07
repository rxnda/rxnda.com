var email = require('../email')
var fillStripe = require('./fill-stripe')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Register', function (test) {
  var attorneyMessage
  var fillMessage
  email.events.on('message', function (data) {
    if (data.subject && data.subject.indexOf('Prescriptions') !== -1) {
      attorneyMessage = data
    } else if (data.subject.indexOf('NDA Prescription from') !== -1) {
      fillMessage = data
    }
  })

  var ATTORNEY_NAME = 'Test Attorney'
  var ATTORNEY_EMAIL = 'valid@example.com'
  var NOTES = 'These are attorney notes.'
  server(function (port, closeServer) {
    webdriver
      .then(registerAttorney)
      .then(function () {
        test.pass('registered')
      })
      .then(chooseForm)
      .then(function () {
        test.pass('chose form')
      })
      .then(writePrescription)
      .then(function () {
        test.pass('wrote prescription')
      })
      .then(fillPrescription)
      .then(function () {
        test.pass('filled prescription')
      })
      .then(function () {
        finish()
      })
      .catch(function (error) {
        console.error(error)
        test.error(error)
        finish()
      })

    function finish () {
      test.end()
      closeServer()
    }

    function registerAttorney () {
      return webdriver
        .url('http://localhost:' + port + '/register')
        .waitForExist('form')
        .setValue('input[name="name"]', ATTORNEY_NAME)
        .setValue('input[name="number"]', '111111')
        .setValue('input[name="email"]', ATTORNEY_EMAIL)
        .click('input[type=submit]')
        .waitForExist('.sent', 10000)
        .getText('h2')
        .then(function (h2Text) {
          test.assert(
            h2Text.includes('Sent'),
            '<h2> says "Sent"'
          )
        })
    }

    function chooseForm () {
      return webdriver
        .url(
          'http://localhost:' + port + '/attorney/' +
          /([a-f0-9]{64})/.exec(attorneyMessage.html)[1]
        )
        .waitForExist('h2')
        .click('input[type=submit]')
    }

    function writePrescription () {
      return webdriver
        .waitForExist('textarea[name=notes]')
        .getText('h2')
        .then(function (text) {
          test.pass(text)
        })
        .setValue('[name=notes]', NOTES)
        .setValue('[name=signatures-sender-company]', 'ClientCo')
        .selectByValue('[name=signatures-sender-form]', 'Corporation')
        .selectByValue('[name=signatures-sender-jurisdiction]', 'California')
        .setValue('[name=signatures-sender-email]', 'test@example.com')
        .click('input[name=terms]')
        .then(function () {
          return fillStripe(webdriver)
        })
        .click('input[type=submit]')
        .waitForExist('h2.sent', 10000)
    }

    function fillPrescription () {
      return webdriver
        .url(
          'http://localhost:' + port + '/fill/' +
          /([a-f0-9]{64})/.exec(fillMessage.html)[1]
        )
        .waitForExist('p*=' + NOTES)
        .then(function () {
          test.pass('shows notes')
        })
        .waitForExist('cite*=' + ATTORNEY_NAME)
        .then(function () {
          test.pass('shows attorney name')
        })
        .waitForExist('a*=' + ATTORNEY_EMAIL)
        .then(function () {
          test.pass('shows attorney e-mail')
        })
        .getAttribute('input[name="signatures-sender-company"]', 'readonly')
        .then(function (value) {
          test.equal(value, 'true', 'company name readonly')
        })
        .getAttribute('input[name="signatures-sender-form"]', 'type')
        .then(function (value) {
          test.equal(value, 'hidden', 'company form locked')
        })
        .getAttribute('input[name="signatures-sender-jurisdiction"]', 'type')
        .then(function (value) {
          test.equal(value, 'hidden', 'company jurisdiction locked')
        })
        .setValue(
          '[name="directions-content,8,form,content,3"]',
          'testing RxNDA'
        )
        .setValue(
          '[name="directions-content,15,form,content,1,form,content,1"]',
          'California'
        )
        .setValue('[name="signatures-sender-name"]', 'Test User')
        .setValue('[name="signatures-sender-title"]', 'CEO')
        .setValue('[name="signatures-sender-signature"]', 'Test User')
        .setValue(
          '[name="signatures-sender-address"]',
          '123 Somewhere, Oakland, CA 94101'
        )
        .setValue('[name="signatures-recipient-email"]', 'recipient@example.com')
        .click('input[name=terms]')
        .then(function () {
          return fillStripe(webdriver)
        })
        .click('input[type=submit]')
        .waitForExist('.sent')
        .then(function () {
          test.pass('sent')
        })
    }
  })
})
