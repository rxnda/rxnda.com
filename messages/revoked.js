var messageEMail = require('./message-email')
var spell = require('reviewers-edition-spell')

module.exports = function (data) {
  var sender = data.signatures.sender
  var attorney = data.attorney
  var form = data.form
  return {
    to: sender.email,
    cc: attorney.email,
    subject: 'NDA Prescription Revoked',
    html: messageEMail(
      'NDA Prescription Revoked',
      [
        `The prescription for ${sender.company || sender.name}’s ` +
        `use of ` +
        `${form.title}, ${spell(form.edition)} has been revoked.`
      ]
    )
  }
}
