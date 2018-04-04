var path = require('path')

module.exports = function couponPath (configuration, code) {
  return path.join(configuration.directory, 'prescription-coupon', code)
}
