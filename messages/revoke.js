var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')
var spell = require('reviewers-edition-spell')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var form = data.form
  var attorney = data.attorney
  var domain = configuration.domain
  return {
    to: attorney.email,
    subject: 'Your ' + domain + ' Prescription Revocation Link',
    html: actionEMail(
      'Your ' + domain + ' Prescription Revocation Link',
      'Cancel Prescription Online',
      [
        `You prescribed ` +
        `${domain}'s  ` +
        `${form.title} form agreement, ${spell(form.edition)} to ` +
        `${sender.company || sender.name}.`
      ],
      `https://${domain}/revoke/${data.revoke}`,
      'Revoke Your Prescription',
      [
        'Keep this link safe and secure. ' +
        'It is is your digital key to revoke the prescription.',
        'Customer service may ask you to share this ' +
        'verification code if you request assistance:',
        customerServiceCode(configuration, data.revoke, sender.email)
      ]
    )
  }
}
