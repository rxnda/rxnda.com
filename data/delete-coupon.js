var couponPath = require('./coupon-path')
var fs = require('fs')

module.exports = function (code, callback) {
  fs.unlink(couponPath(code), callback)
}
