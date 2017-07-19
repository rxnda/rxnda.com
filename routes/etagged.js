var etag = require('etag')

module.exports = function (contentType, body) {
  var tag = etag(body)
  return function (configuration, request, response) {
    var provided = request.headers['if-none-match']
    if (provided && provided === tag) {
      response.statusCode = 304
      response.end()
    } else {
      response.setHeader('Content-Type', contentType)
      response.setHeader('ETag', tag)
      response.end(body)
    }
  }
}
