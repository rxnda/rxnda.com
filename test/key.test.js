var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')

tape.test('GET /key', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/key'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        var contentType = 'text/plain; charset=ASCII'
        test.equal(
          response.headers['content-type'], contentType,
          contentType
        )
        concat(response, function (error, body) {
          test.ifError(error, 'no error')
          test.assert(
            /^[0-9a-f]{64}$/.test(body),
            'serves public key'
          )
          test.end()
          closeServer()
        })
      })
      .end()
  })
})
