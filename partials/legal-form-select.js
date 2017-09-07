var LEGAL_FORMS = require('../data/legal-forms')
var html = require('../routes/html')
var escape = require('../util/escape')

module.exports = function (name, required, prior) {
  var readonly = prior && prior.readonly
  return html`
    ${prior && prior.readonly && html`
      <input
          type=hidden
          name="${escape(name)}"
          value="${escape(prior.value)}">
    `}
    <select name="${escape(name)}"
        ${readonly ? 'disabled' : `name="${escape(name)}"`}
        ${required && 'required'}>
      '<option value=""></option>'
      ${LEGAL_FORMS.map(function (form) {
        return html`
          <option
            value="${escape(form)}"
            ${prior && prior.value === form && 'selected'}>
            ${escape(form)}
          </option>
        `
      })}
    </select>
  `
}
