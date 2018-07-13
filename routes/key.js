var methodNotAllowed = require('./method-not-allowed')

module.exports = function (request, response) {
  if (request.method !== 'GET') {
    return methodNotAllowed.apply(null, arguments)
  }
  response.setHeader('Content-Type', 'text/plain; charset=ASCII')
  response.end(process.env.PUBLIC_KEY)
}
