var wordWrap = require('wordwrap')

var wrap50 = wordWrap(0, 50, {mode: 'soft'})

module.exports = function wrapEMail (configuration, string) {
  return wrap50(
    string + '\n\n' +
    [
      'Do not reply to this message. For help and answers, visit: ',
      'https://' + configuration.domain + '/help'
    ].join('')
  )
}
