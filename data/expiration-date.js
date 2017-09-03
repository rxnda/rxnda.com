module.exports = function expirationDate (data) {
  var date = new Date(data.timestamp)
  if (data.expiration) {
    date.setDate(date.getDate() + data.expiration)
  } else {
    date.setDate(date.getDate() + 7)
  }
  return date
}
