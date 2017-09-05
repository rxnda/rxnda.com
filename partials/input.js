var html = require('../routes/html')

var paragraphs = require('./paragraphs')
var asterisk = require('./asterisk')

module.exports = function input (name, label, notes, prior, errors) {
  var required = (
    name.startsWith('signatures-sender-') ||
    name.startsWith('directions-')
  )
  if (name.endsWith('address')) {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required && asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <textarea
      rows=3
      name="${escape(name)}"
      ${required && 'required'}
      ${prior && prior.readonly && 'readonly=readonly'}
  >${prior && escape(prior.value)}</textarea>
</section>`
  } else {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required && asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
      name="${name}"
      ${(name === 'signatures-sender-name') && 'id=name'}
      type=${name === 'email' ? 'email' : 'text'}
      ${required && 'required'}
      ${prior && prior.readonly && 'readonly=readonly'}
      value='${prior && escape(prior.value)}'>
  ${paragraphs(notes)}
</section>`
  }
}
