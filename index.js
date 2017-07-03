var notFound = require('./routes/not-found')
var routes = require('./routes')
var url = require('url')
var uuid = require('uuid')

module.exports = function (configuration, request, response) {
  // Logging
  var log = configuration.log
  request.log = log.child({request: uuid.v4()})
  request.log.info(request)
  response.once('finish', function () {
    request.log.info(response)
  })

  var parsed = url.parse(request.url, true)
  request.query = parsed.query
  var route = routes.get(parsed.pathname)
  if (route.handler) {
    route.handler(configuration, request, response)
  } else {
    notFound(configuration, request, response)
  }
}
