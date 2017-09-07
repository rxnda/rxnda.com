module.exports = function (webdriver) {
  return webdriver
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
}
