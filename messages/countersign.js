var customerServiceCode = require('../util/customer-service-code')
var formatEmail = require('../util/format-email')

module.exports = function (configuration, data) {
  var sender = data.signatures.sender
  var senderName = sender.company || sender.name
  var recipient = data.signatures.recipient
  var domain = configuration.domain
  return {
    to: sender.email,
    subject: 'NDA from ' + senderName,
    text: formatEmail(configuration, `
${senderName} offers to sign a agreement with 
${recipient.company ? recipient.company : 'you'} 
using ${domain}, a simple online service for 
nondisclosure agreements.

To review the offer and sign or decline online, 
visit this page:

https://${domain}/countersign/${data.sign}

Keep this link safe and secure.  The special code 
within it is your digital key to review and sign 
the NDA.

Customer service may ask you to share this 
verification code if you request assistance:

${customerServiceCode(configuration, data.sign, recipient.email)}
`.trim().replace(/ \n/g, ' '))
  }
}
