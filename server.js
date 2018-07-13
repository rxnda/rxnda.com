var handler = require('./')
var http = require('http')
var pino = require('pino')
var runSeries = require('run-series')
var schedule = require('node-schedule')
var sweepOffers = require('./jobs/offers')
var sweepPrescriptions = require('./jobs/prescriptions')
var uuid = require('uuid')

var log = pino({server: uuid.v4()})

runSeries([
  function launchServer (done) {
    var server = http.createServer(function (request, response) {
      handler(log, request, response)
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

    server.listen(process.env.PORT || 0, function () {
      // If the environment set PORT=0, we'll get a random high port.
      var port = this.address().port
      log.info({port: port}, 'listening')
      done()
    })
  },
  function filesweeper (done) {
    var jobs = [sweepPrescriptions, sweepOffers]
    jobs.forEach(function (job) {
      job(log, function () { })
      schedule.scheduleJob('0 * * * *', function () {
        job(log, function () { /* pass */ })
      })
    })
    done()
  }
], function (error) {
  if (error) log.error(error)
})
