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
        var contentType = 'text/html; charset=UTF-8'
        test.equal(
          response.headers['content-type'], contentType,
          contentType
        )
        concat(response, function (error, body) {
          test.ifError(error)
          var name = '&#8478;nda'
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
