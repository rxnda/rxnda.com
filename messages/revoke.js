var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')
var spell = require('reviewers-edition-spell')

module.exports = function (data) {
  var sender = data.signatures.sender
  var form = data.form
  var attorney = data.attorney
  return {
    to: attorney.email,
    subject: 'Your ' + process.env.DOMAIN + ' Prescription Revocation Link',
    html: actionEMail(
      'Your ' + process.env.DOMAIN + ' Prescription Revocation Link',
      'Cancel Prescription Online',
      [
        `You prescribed ` +
        `${process.env.DOMAIN}'s  ` +
        `${form.title} form agreement, ${spell(form.edition)} to ` +
        `${sender.company || sender.name}.`
      ],
      `https://${process.env.DOMAIN}/revoke/${data.revoke}`,
      'Revoke Your Prescription',
      [
        'Keep this link safe and secure. ' +
        'It is is your digital key to revoke the prescription.',
        'Customer service may ask you to share this ' +
        'verification code if you request assistance:',
        customerServiceCode(data.revoke, sender.email)
      ]
    )
  }
}
