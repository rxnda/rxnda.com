var etag = require('etag')
var methodNotAllowed = require('./method-not-allowed')

module.exports = function (contentType, body) {
  var tag = etag(body)
  return function (request, response) {
    if (request.method !== 'GET') {
      return methodNotAllowed.apply(null, arguments)
    }
    var provided = request.headers['if-none-match']
    if (provided && provided === tag) {
      response.statusCode = 304
      return response.end()
    }
    response.setHeader('Content-Type', contentType)
    response.setHeader('ETag', tag)
    response.end(body)
  }
}
