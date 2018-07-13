var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')
var spell = require('reviewers-edition-spell')

module.exports = function (data) {
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
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
        `${process.env.DOMAIN}'s ${form.title} form nondisclosure agreement, ` +
        `${spell(form.edition)} for your use.`
      ],
      `https://${process.env.DOMAIN}/fill/${data.fill}`,
      'Send the NDA Online',
      [
        'Keep this link safe and secure. ' +
        'It is your digital key to send the NDA with your ' +
        'attorney\u2019s commentary and an on-prescription discount.',
        'Customer service may ask you to share this  ' +
        'verification code if you request assistance:',
        customerServiceCode(data.fill, sender.email)
      ]
    )
  }
}
