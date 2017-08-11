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
      .catch(function (error) {
        test.ifError(error)
        test.end()
        closeServer()
      })
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

tape.test('invalid send w/o form validation', function (test) {
  server(function (port, closeServer) {
    webdriver
      .url('http://localhost:' + port + '/send/Example_NDA/1e1d?novalidate=1')
      .setValue(
        'input[name="directions-content,1"]',
        'to discuss the sale of enterprise software'
      )
      .setValue(
        'input[name="signatures-sender-name"]',
        'Test User'
      )
      .setValue(
        'input[name="signatures-sender-signature"]',
        'Not Test User'
      )
      .setValue(
        'input[name="signatures-sender-email"]',
        'sender@example.com'
      )
      .setValue(
        'textarea[name="signatures-sender-address"]',
        '123 Somewhere, Oakland, CA 94101'
      )
      .setValue(
        'input[name="signatures-recipient-email"]',
        'recipient@example.com'
      )
      .click('input[name="terms"]')
      .waitForExist('iframe')
      .element('iframe')
      .then(function (response) {
        return webdriver.frame(response.value)
      })
      .setValue('input[name="cardnumber"]', '4242 4242 4242 4242')
      .setValue('input[name="exp-date"]', '11 / 30')
      .setValue('input[name="cvc"]', '123')
      .waitForExist('input[name="postal"]')
      .setValue('input[name="postal"]', '44444')
      .frameParent()
      .click('input[type="submit"]')
      .waitForExist('.error', 20000)
      .getText('.field .error')
      .catch(function (error) {
        test.ifError(error)
      })
      .then(function (text) {
        test.equal(
          text, 'Your signature must match your name exactly.',
          'shows signature error'
        )
        test.end()
        closeServer()
      })
  })
})

tape.test('send w/ coupon', function (test) {
  server(function (port, closeServer) {
    webdriver
      .url('http://localhost:' + port + '/send/Testing/1e?coupon=testcoupon')
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
      .getText('h2')
      .catch(function (error) {
        test.ifError(error)
        test.end()
        closeServer()
      })
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

tape.test('send w/ invalid coupon', function (test) {
  server(function (port, closeServer) {
    webdriver
      .url('http://localhost:' + port + '/send/Testing/1e?coupon=invalid')
      .getText('section#payment h3')
      .catch(function (error) {
        test.ifError(error)
        test.end()
        closeServer()
      })
      .then(function (text) {
        test.equal(
          text, 'Credit Card Payment',
          'shows credit card entry'
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
        path: '/send/N-2W-B2B/1e3d',
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
