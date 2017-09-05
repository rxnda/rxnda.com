var handler = require('./')
var http = require('http')
var path = require('path')
var pino = require('pino')
var runSeries = require('run-series')
var schedule = require('node-schedule')
var sweepOffers = require('./jobs/offers')
var sweepPrescriptions = require('./jobs/prescriptions')
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
    prescribe: ENV.PRESCRIBE_PRICE
      ? parseInt(ENV.PRESCRIBE_PRICE)
      : 20,
    fill: ENV.FILL_PRICE
      ? parseInt(ENV.FILL_PRICE)
      : 5
  },
  terms: {
    prescription: ENV.PRESCRIPTION_TERM
      ? parseInt(ENV.PRESCRIPTION_TERM)
      : 180
  },
  log: log,
  stripe: {
    public: ENV.STRIPE_PUBLIC_KEY,
    private: ENV.STRIPE_PRIVATE_KEY
  },
  domain: ENV.DOMAIN || 'rxnda.com',
  email: {
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
    var jobs = [sweepPrescriptions, sweepOffers]
    jobs.forEach(function (job) {
      job(configuration, function () { })
      schedule.scheduleJob('0 * * * *', function () {
        job(configuration, function () { /* pass */ })
      })
    })
    done()
  }
], function (error) {
  if (error) {
    log.error(error)
  }
})
