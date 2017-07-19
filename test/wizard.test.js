var server = require('./server')
var tape = require('tape')
var webdriver = require('./webdriver')

tape.test('Wizard', function (test) {
  server(function (port, closeServer) {
    webdriver
      .url('http://localhost:' + port)
      .waitForExist('nav', 20000)
      .click('//a[contains(text(),"Send")]')
      .waitForExist('//h2[contains(text(),"Send an RxNDA Form")]', 20000)
      .selectByValue('select[name="sender"]', 'business')
      .selectByValue('select[name="recipient"]', 'business')
      .selectByValue('select[name="direction"]', 'two-way')
      .selectByValue('select[name="scope"]', 'narrow')
      .click('input[type="submit"]')
      .waitForExist('h2 cite')
      .getText('h2 cite')
      .then(function (text) {
        test.assert(
          text.includes('N-2W-B2B'),
          'redirects to N-2W-B2B'
        )
        test.end()
        closeServer()
      })
      .catch(function (error) {
        test.ifError(error)
        test.end()
        closeServer()
      })
  })
})
