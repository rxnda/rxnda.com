var methodNotAllowed = require('./routes/method-not-allowed')
var notFound = require('./routes/not-found')
var routes = require('./routes')
var url = require('url')
var uuid = require('uuid')

module.exports = function onRequest (serverLog, request, response) {
  // Logging
  var id = uuid.v4()
  request.log = serverLog.child({request: id})
  request.log.info(request)
  request.id = id
  response.once('finish', function () {
    request.log.info(response)
  })

  // Routing
  var method = request.method
  if (method !== 'GET' && method !== 'POST') {
    return methodNotAllowed(request, response)
  }
  var parsed = url.parse(request.url, true)
  request.query = parsed.query
  var route = routes.get(parsed.pathname)
  request.params = route.params
  if (route.handler) return route.handler(request, response)
  notFound(request, response, [
    'The link you followed here is broken.',
    'Visit the pages linked above to learn more about RxNDA.'
  ])
}
