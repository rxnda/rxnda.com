var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')

tape.test('GET /prices', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/prices'
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
        test.end()
        closeServer()
      })
      .end()
  })
})
