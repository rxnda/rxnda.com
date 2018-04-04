var prescriptionCouponPath = require('./prescription-coupon-path')
var fs = require('fs')

module.exports = function (configuration, code, callback) {
  fs.readFile(
    prescriptionCouponPath(configuration, code), 'utf8',
    function (error, data) {
      if (error) {
        /* istanbul ignore else */
        if (error.code === 'ENOENT') {
          callback(null, false)
        } else {
          callback(error)
        }
      } else {
        callback(null, data)
      }
    }
  )
}
