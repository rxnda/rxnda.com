var ecb = require('ecb')
var handler = require('./')
var http = require('http')
var path = require('path')
var pino = require('pino')
var readForms = require('./data/read-forms')
var runSeries = require('run-series')
var sweep = require('./sweep')
var uuid = require('uuid')

var ENV = process.env

var log = pino({server: uuid.v4()})
var timeout

var configuration = {
  directory: ENV.DIRECTORY
    ? ENV.DIRECTORY
    : path.join(process.cwd(), 'rxnda'),
  port: ENV.PORT ? parseInt(ENV.PORT) : 8080,
  prices: {
    use: ENV.USE_PRICE
      ? parseInt(ENV.USE_PRICE)
      : 10
  },
  log: log,
  stripe: {
    public: ENV.STRIPE_PUBLIC_KEY,
    private: ENV.STRIPE_PRIVATE_KEY
  },
  domain: ENV.DOMAIN || 'rxnda.com',
  mailgun: {
    key: ENV.MAILGUN_KEY,
    domain: ENV.MAILGUN_DOMAIN,
    sender: ENV.MAILGUN_SENDER || 'notifications'
  },
  keys: {
    public: Buffer.from(ENV.PUBLIC_KEY, 'hex'),
    private: Buffer.from(ENV.PRIVATE_KEY, 'hex')
  }
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
  },
  function filesweeper (done) {
    var log = configuration.log.child({subsystem: 'filesweeper'})
    function schedule () {
      var now = new Date()
      var toMidnight = (
        ((24 - now.getHours()) * 60 * 60 * 1000) +
        ((60 - now.getMinutes()) * 60 * 1000)
      )
      log.info({delay: toMidnight}, 'setTimeout')
      timeout = setTimeout(
        function () {
          sweep(configuration, schedule)
        },
        toMidnight
      )
    }
    sweep(configuration, schedule)
    done()
  }
], function (error) {
  if (error) {
    log.error(error)
  }
})
