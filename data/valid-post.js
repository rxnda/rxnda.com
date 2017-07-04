var analyze = require('commonform-analyze')
var sameArray = require('./same-array')

module.exports = function (data, edition) {
  var formBlanks = analyze(edition.commonform).blanks
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  return (
    // Sender
    sender.name &&
    sender.signature &&
    sender.name === sender.signature &&
    sender.email &&
    // Recipient
    recipient.email &&
    // Directions
    Array.isArray(data.directions) &&
    data.directions.every(function (direction) {
      return (
        direction.blank &&
        Array.isArray(direction.blank) &&
        direction.value &&
        typeof direction.value === 'string'
      )
    }) &&
    formBlanks.length === data.directions.length &&
    data.token &&
    formBlanks.every(function (emptyBlank) {
      return data.directions.some(function (direction) {
        return sameArray(emptyBlank, direction.blank)
      })
    }) &&
    true
  )
}
