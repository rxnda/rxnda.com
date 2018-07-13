var couponPath = require('./coupon-path')
var fs = require('fs')

module.exports = function (code, callback) {
  fs.readFile(
    couponPath(code), 'utf8',
    function (error, data) {
      if (error) {
        /* istanbul ignore else */
        if (error.code === 'ENOENT') return callback(null, false)
        return callback(error)
      }
      callback(null, data)
    }
  )
}
