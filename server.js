var ecb = require('ecb')
var handler = require('./')
var http = require('http')
var path = require('path')
var pino = require('pino')
var readForms = require('./data/read-forms')
var runSeries = require('run-series')
var uuid = require('uuid')

var ENV = process.env

var log = pino({server: uuid.v4()})

var configuration = {
  directory: ENV.DIRECTORY
    ? ENV.DIRECTORY
    : path.join(process.cwd(), 'rxnda'),
  port: ENV.PORT ? parseInt(ENV.PORT) : 8080,
  prices: {
    use: ENV.USE_PRICE
      ? parseInt(ENV.USE_PRICE)
      : 10,
    prescription: ENV.PRESCRIPTION_PRICE
      ? parseInt(ENV.PRESCRIPTION_PRICE)
      : 5
  },
  log: log
}

runSeries([
  function readFormsToConfiguration (done) {
    readForms(configuration, ecb(done, function (forms) {
      configuration.forms = forms
      done()
    }))
  },
  function launchServer (done) {
    var server = http.createServer(function (request, response) {
      handler(configuration, request, response)
    })

    function close () {
      log.info('closing')
      server.close(function () {
        log.info('closed')
        process.exit(0)
      })
    }

    function trapSignal () {
      close()
    }

    process.on('SIGINT', trapSignal)
    process.on('SIGQUIT', trapSignal)
    process.on('SIGTERM', trapSignal)
    process.on('uncaughtException', function (exception) {
      log.error(exception)
      close()
    })

    server.listen(configuration.port, function () {
      // If the environment set PORT=0, we'll get a random high port.
      configuration.port = this.address().port
      log.info({port: configuration.port}, 'listening')
      done()
    })
  }
], function (error) {
  if (error) {
    log.error(error)
  }
})
