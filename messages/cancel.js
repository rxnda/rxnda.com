var customerServiceCode = require('../util/customer-service-code')
var formatEmail = require('../util/format-email')
var spell = require('reviewers-edition-spell')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var recipient = data.signatures.recipient
  var form = data.form
  var domain = configuration.domain
  return {
    to: sender.email,
    subject: 'Your ' + domain + ' Cancellation Link',
    text: formatEmail(configuration, `
You have offered to sign a nondisclosure agreement 
${sender.company ? ('on behalf of' + sender.company) : ''} with 
${recipient.company || recipient.name || recipient.email} 
on the terms of ${domain}'s 
${form.title} form agreement, ${spell(form.edition)}.

To cancel your request before the other side 
signs, visit this page:

https://${domain}/cancel/${data.cancel}

Keep this link safe and secure. The special code 
within it is your digital key to cancel the 
request.

Customer service may ask you to share this 
verification code if you request assistance:

${customerServiceCode(configuration, data.cancel, sender.email)}
`.trim().replace(/ \n/g, ' '))
  }
}
