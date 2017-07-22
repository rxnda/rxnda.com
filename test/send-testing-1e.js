module.exports = function (webdriver, port, from) {
  return webdriver
    .url('http://localhost:' + port + '/send/Testing/1e')
    .setValue(
      'input[name="signatures-sender-name"]',
      'Test Sender'
    )
    .setValue(
      'input[name="signatures-sender-signature"]',
      'Test Sender'
    )
    .setValue(
      'input[name="signatures-sender-email"]',
      from
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
