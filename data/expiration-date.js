module.exports = function expirationDate (send) {
  var date = new Date(send.timestamp)
  date.setDate(date.getDate() + 7)
  return date
}
