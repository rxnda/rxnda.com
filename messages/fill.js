var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')
var spell = require('reviewers-edition-spell')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var domain = configuration.domain
  var attorney = data.attorney
  var form = data.form
  return {
    to: sender.email,
    cc: attorney.email,
    subject: 'NDA Prescription from ' + attorney.name,
    html: actionEMail(
      'NDA Prescription from ' + attorney.name,
      'Send NDAs online.',
      [
        `${attorney.name} prescribed ${senderName} ` +
        `${domain}'s ${form.title} form nondisclosure agreement, ` +
        `${spell(form.edition)} for your use.`
      ],
      `https://${domain}/fill/${data.fill}`,
      'Send NDAs Online',
      [
        'Keep this link safe and secure. ' +
        'It is your digital key to send the NDA with your ' +
        'attorney\u2019s commentary and an on-prescription discount.',
        'Customer service may ask you to share this  ' +
        'verification code if you request assistance:',
        customerServiceCode(configuration, data.fill, sender.email)
      ]
    )
  }
}
