var crypto = require('crypto')
var ed25519 = require('ed25519')
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
  var keypair = ed25519.MakeKeypair(crypto.randomBytes(32))
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
    var configuration = {
      directory: directory,
      log: pino(fs.createWriteStream('test-server.log')),
      prices: {
        use: 10,
        prescribe: 20,
        fill: 5
      },
      terms: {
        prescription: 180
      },
      domain: 'rxnda.com',
      stripe: {
        public: process.env.STRIPE_PUBLIC_KEY,
        private: process.env.STRIPE_PRIVATE_KEY
      },
      email: {
        domain: 'rxnda.com',
        sender: 'notifications'
      },
      keys: {
        public: keypair.publicKey,
        private: keypair.privateKey
      }
    }
    http.createServer()
      .on('request', function (request, response) {
        handler(configuration, request, response)
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
        }, configuration)
      })
  })
}
