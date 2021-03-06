module.exports = function (webdriver, port) {
  return webdriver
    .url('http://localhost:' + port + '/send/Example_NDA/1e1d')
    .setValue(
      'input[name="directions-content,1"]',
      'to discuss the sale of enterprise software'
    )
    .setValue(
      'input[name="signatures-sender-name"]',
      'Test User'
    )
    .setValue(
      'input[name="signatures-sender-signature"]',
      'Test User'
    )
    .setValue(
      'input[name="signatures-sender-email"]',
      'sender@example.com'
    )
    .setValue(
      'textarea[name="signatures-sender-address"]',
      '123 Somewhere, Oakland, CA 94101'
    )
    .setValue(
      'input[name="signatures-recipient-email"]',
      'recipient@example.com'
    )
    .click('input[name="terms"]')
    .waitForExist('iframe')
    .element('iframe')
    .then(function (response) {
      return webdriver.frame(response.value)
    })
    .setValue('input[name="cardnumber"]', '4242 4242 4242 4242')
    .setValue('input[name="exp-date"]', '11 / 30')
    .setValue('input[name="cvc"]', '123')
    .waitForExist('input[name="postal"]')
    .setValue('input[name="postal"]', '44444')
    .frameParent()
    .click('input[type="submit"]')
}
