var path = require('path')

module.exports = function couponPath (code) {
  return path.join(process.env.DIRECTORY, 'prescription-coupon', code)
}
