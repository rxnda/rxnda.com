var couponPath = require('./coupon-path')
var fs = require('fs')

module.exports = function (code, callback) {
  fs.readFile(
    couponPath(code), 'utf8',
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
