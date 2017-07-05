var analyze = require('commonform-analyze')
var sameArray = require('./same-array')

module.exports = function (data, form) {
  var formBlanks = analyze(form.commonform).blanks
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var page = form.signatures[0]
  return (
    // Sender
    sender.name &&
    sender.signature &&
    sender.name === sender.signature &&
    sender.email &&
    // Signature Page
    (
      !page.entities ||
      (
        sender.company &&
        sender.jurisdiction &&
        sender.form &&
        sender.title
      )
    ) &&
    (page.information || [])
      .filter(function (element) {
        return element !== 'date'
      })
      .every(function (element) {
        return sender[element] && typeof sender[element] === 'string'
      }) &&
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
