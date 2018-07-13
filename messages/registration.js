var customerServiceCode = require('../util/customer-service-code')
var actionEMail = require('./action-email')

module.exports = function (data) {
  return {
    to: data.email,
    subject: 'Write RxNDA Prescriptions',
    html: actionEMail(
      'Write RxNDA Prescriptions',
      'Your ' + process.env.DOMAIN + ' link to write NDA prescriptions',
      [
        'Use the link below to write prescriptions through RxNDA.'
      ],
      `https://${process.env.DOMAIN}/attorney/${data.capability}`,
      'Write Prescriptions',
      [
        'Keep this link safe and secure. ' +
        'It is is your digital key to write prescriptions.',
        'Customer service may ask you to share this ' +
        'verification code if you request assistance:',
        customerServiceCode(data.capability, data.email)
      ]
    )
  }
}
