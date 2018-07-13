var prescriptionCouponPath = require('./prescription-coupon-path')
var fs = require('fs')

module.exports = function (code, callback) {
  fs.unlink(prescriptionCouponPath(code), callback)
}
