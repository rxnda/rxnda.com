var LEGAL_FORMS = require('../data/legal-forms')
var html = require('../routes/html')
var escape = require('../util/escape')

module.exports = function (name, required, prior) {
  return html`
    <select name="${escape(name)}" ${required && 'required'}>
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
