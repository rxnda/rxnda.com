var handler = require('./')
var http = require('http')
var path = require('path')

var ENV = process.env

var configuration = {
  directory: ENV.DIRECTORY
    ? ENV.DIRECTORY
    : path.join(process.cwd(), 'rxnda'),
  port: ENV.PORT ? parseInt(ENV.PORT) : 8080
}

var server = http.createServer(function (request, response) {
  handler(configuration, request, response)
})

function close () {
  server.close(function () {
    process.exit(0)
  })
}

function trap () {
  close()
}

process.on('SIGINT', trap)
process.on('SIGQUIT', trap)
process.on('SIGTERM', trap)
process.on('uncaughtException', function (exception) {
  close()
})

server.listen(configuration.port, function () {
  // If the environment set PORT=0, we'll get a random high port.
  configuration.port = this.address().port
})
