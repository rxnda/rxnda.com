var email = require('../email')
var http = require('http')
var runSeries = require('run-series')
var sendTesting1e = require('./send-testing-1e')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Expired', function (test) {
  var signEMail
  var cancelEMail
  email.events.on('message', function (data) {
    if (data.subject.startsWith('NDA')) {
      signEMail = data
    }
    if (data.subject.endsWith('Cancellation Link')) {
      cancelEMail = data
    }
  })
  server(function (port, closeServer, configuration) {
    runSeries([
      function send (done) {
        sendTesting1e(
          webdriver, port,
          // Magic Test Value!
          // See code and comments in the route.
          'backdate@example.com'
        )
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
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      closeServer()
    })
  })
})
