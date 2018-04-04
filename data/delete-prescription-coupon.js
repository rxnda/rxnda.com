var prescriptionCouponPath = require('./prescription-coupon-path')
var fs = require('fs')

module.exports = function (configuration, code, callback) {
  fs.unlink(prescriptionCouponPath(configuration, code), callback)
}
