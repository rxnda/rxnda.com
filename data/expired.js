var expirationDate = require('./expiration-date')

module.exports = function expired (send) {
  var expired = expirationDate(send)
  var now = new Date()
  return now.getTime() > expired.getTime()
}
