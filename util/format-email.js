var wordWrap = require('word-wrap')

module.exports = function wrapEMail (configuration, string) {
  return wordWrap(
    (
      string + '\n\n' +
      [
        'Do not reply to this message. For help and answers, visit: ',
        'https://' + configuration.domain + '/help'
      ].join('')
    ),
    {
      width: 50,
      indent: ''
    }
  )
}
