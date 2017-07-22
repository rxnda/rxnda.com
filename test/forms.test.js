var http = require('http')
var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Browse Forms', function (test) {
  server(function (port, closeServer) {
    webdriver
      .url('http://localhost:' + port)
      .waitForExist('nav', 20000)
      .click('//a[contains(text(),"Forms")]')
      .waitForExist('//h2[contains(text(),"Forms")]', 20000)
      .click('//a[contains(text(),"View all available editions")]')
      .waitForExist('//a[contains(text(),"Read Online")]', 20000)
      .click('//a[contains(text(),"Read Online")]')
      .waitForExist('.commonform')
      .then(function () {
        test.pass('navigated to form')
        test.end()
        closeServer()
      })
      .catch(function (error) {
        test.ifError(error, 'no error')
        test.end()
        closeServer()
      })
  })
})

tape.test('GET /forms/{nonexistent}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/forms/nonexistent'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('GET /forms/{nonexistent}/{nonexistent}', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      path: '/forms/nonexistent/nonexistent'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 404,
          'responds 404'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})

tape.test('DELETE /forms', function (test) {
  server(function (port, closeServer) {
    http.request({
      port: port,
      method: 'DELETE',
      path: '/forms'
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 405,
          'responds 405'
        )
        test.end()
        closeServer()
      })
      .end()
  })
})
