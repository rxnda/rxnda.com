var handler = require('./')
var http = require('http')
var path = require('path')
var pino = require('pino')
var uuid = require('uuid')

var ENV = process.env

var log = pino({server: uuid.v4()})

var configuration = {
  directory: ENV.DIRECTORY
    ? ENV.DIRECTORY
    : path.join(process.cwd(), 'rxnda'),
  port: ENV.PORT ? parseInt(ENV.PORT) : 8080,
  log: log
}

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
})
