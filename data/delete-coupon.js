var couponPath = require('./coupon-path')
var fs = require('fs')

module.exports = function (configuration, code, callback) {
  fs.unlink(couponPath(configuration, code), callback)
}
