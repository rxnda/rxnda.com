var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')
var spell = require('reviewers-edition-spell')

module.exports = function (data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var form = data.form
  var recipientName = (
    recipient.company || recipient.name || recipient.email
  )
  return {
    to: sender.email,
    subject: 'Your ' + process.env.DOMAIN + ' Cancellation Link',
    html: actionEMail(
      'Your ' + process.env.DOMAIN + ' Cancellation Link',
      'Cancel Offer ' + recipientName + ' Online',
      [
        `You offered to sign a nondisclosure agreement ` +
        `${sender.company ? ('on behalf of ' + sender.company) : ''} ` +
        `with ${recipientName} on the terms of ${process.env.DOMAIN}'s  ` +
        `${form.title} form agreement, ${spell(form.edition)}.`
      ],
      `https://${process.env.DOMAIN}/cancel/${data.cancel}`,
      'Cancel Your Offer',
      [
        'Keep this link safe and secure. ' +
        'It is is your digital key to cancel the offer.',
        'Customer service may ask you to share this ' +
        'verification code if you request assistance:',
        customerServiceCode(data.cancel, sender.email)
      ]
    )
  }
}
