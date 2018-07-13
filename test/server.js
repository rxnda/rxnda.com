var ed25519 = require('../ed25519')
var fs = require('fs')
var handler = require('../')
var http = require('http')
var ncp = require('ncp')
var os = require('os')
var path = require('path')
var pino = require('pino')
var rimraf = require('rimraf')
var runSeries = require('run-series')

module.exports = function (test) {
  var prefix = path.join(os.tmpdir(), 'rxnda')
  var keypair = ed25519.keys()
  process.env.PUBLIC_KEY = keypair.publicKey.toString('hex')
  process.env.PRIVATE_KEY = keypair.privateKey.toString('hex')
  process.env.USE_PRICE = 10
  process.env.PRESCRIBE_PRICE = 10
  process.env.FILL_PRICE = 5
  process.env.PRESCRIPTION_TERM = 180
  process.env.DOMAIN = 'rxnda.com'
  process.env.MAILGUN_DOMAIN = 'rxnda.com'
  process.env.MAILGUN_SENDER = 'notifications'
  var directory
  runSeries([
    function (done) {
      fs.mkdtemp(prefix, function (error, created) {
        if (error) {
          done(error)
        } else {
          directory = created
          done()
        }
      })
    },
    function (done) {
      ncp(
        path.join(__dirname, '..', 'example-directory'),
        directory,
        done
      )
    }
  ], function (error) {
    if (error) {
      throw error
    }
    var serverLog = pino(fs.createWriteStream('test-server.log'))
    process.env.DIRECTORY = directory
    http.createServer()
      .on('request', function (request, response) {
        try {
          handler(serverLog, request, response)
        } catch (error) {
          console.error(error)
        }
      })
      .listen(0, function onceListening () {
        var server = this
        var port = server.address().port
        test(port, function closeServer () {
          server.close(function () {
            rimraf(directory, function () {
              // pass
            })
          })
        }, serverLog)
      })
  })
}

process.on('uncaughtException', function (error) {
  console.error(error)
})
