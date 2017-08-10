var methodNotAllowed = require('./method-not-allowed')

module.exports = function (configuration, request, response) {
  if (request.method !== 'GET') {
    methodNotAllowed.apply(null, arguments)
  } else {
    response.setHeader('Content-Type', 'text/plain; charset=ASCII')
    response.end(configuration.keys.public.toString('hex'))
  }
}
