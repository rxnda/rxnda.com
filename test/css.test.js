var http = require('http')
var server = require('./server')
var tape = require('tape')

testCSS('/normalize.css')
testCSS('/styles.css')

function testCSS (path) {
  tape.test('GET ' + path, function (test) {
    server(function (port, closeServer) {
      http.request({
        port: port,
        path: path
      })
        .once('response', function (response) {
          test.equal(
            response.statusCode, 200,
            'responds 200'
          )
          var contentType = 'text/css; charset=UTF-8'
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
}
