var wordWrap = require('word-wrap')

module.exports = function wrapEmail (configuration, string) {
  return wordWrap(
    (
      string + '\n\n' +
      [
        'Do not reply to this message. For help and answers, visit: ',
        'https://' + configuration.domain + '/help'
      ].join('')
    ),
    {
      width: 55,
      indent: ''
    }
  )
}
