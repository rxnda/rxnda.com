var escape = require('../util/escape')
var html = require('../routes/html')

var asterisk = require('./asterisk')
var jurisdictionSelect = require('./jurisdiction-select')
var legalFormSelect = require('./legal-form-select')
var optional = require('./optional')
var paragraphs = require('./paragraphs')

module.exports = function input (options) {
  var errors = options.errors
  var label = options.label
  var name = options.name
  var notes = options.notes
  var prior = options.prior
  var required = options.required || false
  if (name.endsWith('address')) {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required ? asterisk() : optional()}
  ${errors && paragraphs(errors, 'error')}
  <textarea
      rows=3
      name="${escape(name)}"
      ${required && 'required'}
      ${prior && prior.readonly && 'readonly=readonly'}
  >${prior && escape(prior.value)}</textarea>
  ${prior && prior.prefilled && prefilled()}
  ${notes && paragraphs(notes)}
</section>`
  } else if (name.endsWith('jurisdiction')) {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required ? asterisk() : optional()}
  ${errors && paragraphs(errors, 'error')}
  ${jurisdictionSelect(name, required, prior)}
  ${prior && prior.prefilled && prefilled()}
  ${notes && paragraphs(notes)}
</section>`
  } else if (name.endsWith('form')) {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required ? asterisk() : optional()}
  ${errors && paragraphs(errors, 'error')}
  ${legalFormSelect(name, required, prior)}
  ${prior && prior.prefilled && prefilled()}
  ${notes && paragraphs(notes)}
</section>`
  } else {
    return html`
<section class=field>
  <label>${escape(label)}</label>
  ${required ? asterisk() : optional()}
  ${errors && paragraphs(errors, 'error')}
  <input
      name="${name}"
      ${(name === 'signatures-sender-name') && 'id=name'}
      type=${name === 'email' ? 'email' : 'text'}
      ${required && 'required'}
      ${prior && prior.readonly && 'readonly=readonly'}
      value='${prior && escape(prior.value)}'>
  ${prior && prior.prefilled && prefilled()}
  ${notes && paragraphs(notes)}
</section>`
  }
}

function prefilled () {
  return html`
<p class=note>
  The sender filled this blank out for you.
  If they did so incorrectly, tell them to resend the request.
</p>
  `
}
