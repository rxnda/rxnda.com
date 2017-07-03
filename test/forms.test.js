var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tap = require('tap')

tap.test('GET /forms', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/forms'
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
        concat(response, function (error, body) {
          test.ifError(error)
          var title = 'Example NDA'
          test.assert(
            body.indexOf(title) !== -1,
            'includes ' + JSON.stringify(title)
          )
          test.end()
          closeServer()
        })
      })
      .end()
  })
})
