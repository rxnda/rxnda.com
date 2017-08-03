var ecb = require('ecb')
var email = require('../email')
var fs = require('fs')
var http = require('http')
var path = require('path')
var runSeries = require('run-series')
var sendTesting1e = require('./send-testing-1e')
var server = require('./server')
var sweep = require('../sweep')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Sweep Backdated', function (test) {
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

tape.test('Sweep Unexpired', function (test) {
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
        sendTesting1e(webdriver, port, 'donotbackdate@example.com')
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
              response.statusCode, 200,
              '/countersign/{capability} responds 200'
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
              response.statusCode, 200,
              '/cancel/{capability} responds 200'
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
            test.equal(
              files.length, 1,
              '/' + subdirectory + ' has one file'
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
