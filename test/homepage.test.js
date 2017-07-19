var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')

tape.test('GET /', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        var contentType = 'text/html; charset=ASCII'
        test.equal(
          response.headers['content-type'], contentType,
          contentType
        )
        test.assert(
          response.headers.etag.length > 0,
          'sets ETag'
        )
        concat(response, function (error, body) {
          test.ifError(error, 'no error')
          var name = 'RxNDA'
          test.assert(
            body.indexOf(name) !== -1,
            'includes ' + JSON.stringify(name)
          )
          test.end()
          closeServer()
        })
      })
      .end()
  })
})
