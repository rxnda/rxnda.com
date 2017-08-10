var email = require('../email')
var fs = require('fs')
var path = require('path')
var runSeries = require('run-series')
var sendSimple = require('./send-simple')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Countersign', function (test) {
  var signEMail
  email.events.on('message', function (data) {
    if (data.subject && data.subject.indexOf('NDA') === 0) {
      signEMail = data
    }
  })
  server(function (port, closeServer) {
    sendSimple(webdriver, port)
      .waitForExist('.sent', 20000)
      .then(function () {
        return webdriver.url(
          'http://localhost:' + port + '/countersign/' +
          /([a-f0-9]{64})/.exec(signEMail.html)[1]
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

tape.test('Countersign w/ coupon', function (test) {
  var signEMail
  email.events.on('message', function (data) {
    if (data.subject && data.subject.indexOf('NDA') === 0) {
      signEMail = data
    }
  })
  server(function (port, closeServer, configuration) {
    var couponFile = path.join(configuration.directory, 'coupon', 'abc')
    runSeries([
      function (done) {
        fs.writeFile(couponFile, 'test coupon', done)
      },
      function (done) {
        webdriver
          .url(
            'http://localhost:' + port + '/send/Testing/1e?coupon=abc'
          )
          .setValue(
            'input[name="signatures-sender-name"]',
            'Test User'
          )
          .setValue(
            'input[name="signatures-sender-signature"]',
            'Test User'
          )
          .setValue(
            'input[name="signatures-sender-email"]',
            'sender@example.com'
          )
          .setValue(
            'input[name="signatures-recipient-email"]',
            'recipient@example.com'
          )
          .click('input[name="terms"]')
          .click('input[type="submit"]')
          .waitForExist('.sent', 20000)
          .then(function () {
            return webdriver.url(
              'http://localhost:' + port + '/countersign/' +
              /([a-f0-9]{64})/.exec(signEMail.html)[1]
            )
          })
          .waitForExist(
            'input[name="signatures-recipient-name"]', 20000
          )
          .setValue(
            'input[name="signatures-recipient-name"]',
            'Bob'
          )
          .setValue(
            'input[name="signatures-recipient-signature"]',
            'Bob'
          )
          .click('input[name=terms]')
          .click('input[type=submit]')
          .waitForExist('.agreed')
          .getText('h2')
          .catch(done)
          .then(function (h1Text) {
            test.assert(
              h1Text.includes('Agreed!'),
              '<h2> says "Agreed!"'
            )
            done()
          })
      },
      function (done) {
        fs.stat(couponFile, function (error, stat) {
          test.assert(
            error && error.code === 'ENOENT',
            'coupon file deleted'
          )
          done()
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      closeServer()
    })
  })
})

tape.test('Receipt E-Mail', function (test) {
  var receipt
  var signEMail
  email.events.on('message', function (data) {
    if (data.subject && data.subject.endsWith('Receipt')) {
      receipt = data
    } else if (data.subject && data.subject.startsWith('NDA')) {
      signEMail = data
    }
  })
  server(function (port, closeServer) {
    sendSimple(webdriver, port)
      .waitForExist('.sent', 20000)
      .then(function () {
        return webdriver.url(
          'http://localhost:' + port + '/countersign/' +
          /([a-f0-9]{64})/.exec(signEMail.html)[1]
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
      .catch(function (error) {
        test.ifError(error)
        test.end()
        closeServer()
      })
      .then(function (result) {
        test.assert(
          receipt.html.includes('$10.00 Paid'),
          'bills $10'
        )
        test.end()
        closeServer()
      })
  })
})
