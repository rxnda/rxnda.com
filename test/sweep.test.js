var ecb = require('ecb')
var email = require('../email')
var fs = require('fs')
var http = require('http')
var path = require('path')
var runSeries = require('run-series')
var server = require('./server')
var sweep = require('../sweep')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Sweep', function (test) {
  var signEMail
  var cancelEMail
  email.events.on('message', function (data) {
    if (data.subject.includes('NDA Offer')) {
      signEMail = data
    }
    if (data.subject.includes('Cancellation Link')) {
      cancelEMail = data
    }
  })
  server(function (port, closeServer, configuration) {
    runSeries([
      function send (done) {
        webdriver
          .url('http://localhost:' + port + '/send/Testing/1e')
          .setValue(
            'input[name="signatures-sender-name"]',
            'Test Sender'
          )
          .setValue(
            'input[name="signatures-sender-signature"]',
            'Test Sender'
          )
          .setValue(
            'input[name="signatures-sender-email"]',
            // Magic Test Value!
            // See code and comments in the route.
            'backdate@example.com'
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
          .waitForExist('.sent', 20000)
          .catch(function (error) {
            done(error)
          })
          .then(function () {
            test.pass('sent')
            done()
          })
      },
      function checkMail (done) {
        test.assert(
          signEMail,
          'sent countersign e-mail'
        )
        test.assert(
          cancelEMail,
          'sent cancel e-mail'
        )
        done()
      },
      function runSweep (done) {
        sweep(configuration, function (error) {
          test.pass('swept')
          done(error)
        })
      },
      function getSign (done) {
        http.get(
          'http://localhost:' + port + '/countersign/' +
          /([a-f0-9]{64})/.exec(signEMail.text)[1],
          function (response) {
            test.equal(
              response.statusCode, 404,
              '/countersign/{capability} responds 404'
            )
            done()
          }
        )
      },
      function getCancel (done) {
        http.get(
          'http://localhost:' + port + '/cancel/' +
          /([a-f0-9]{64})/.exec(cancelEMail.text)[1],
          function (response) {
            test.equal(
              response.statusCode, 404,
              '/cancel/{capability} responds 404'
            )
            done()
          }
        )
      }
    ].concat(
      ['charge', 'sign', 'cancel'].map(function (subdirectory) {
        return function checkEmpty (done) {
          var checking = path.join(
            configuration.directory, subdirectory
          )
          fs.readdir(checking, ecb(done, function (files) {
            test.deepEqual(
              files, [],
              '/' + subdirectory + ' is empty'
            )
            done()
          }))
        }
      })
    ), function (error) {
      test.ifError(error, 'no error')
      test.end()
      closeServer()
    })
  })
})
