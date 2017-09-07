var JURISDICTIONS = require('../data/jurisdictions')
var html = require('../routes/html')
var escape = require('../util/escape')

module.exports = function (name, required, prior) {
  var readonly = prior && prior.readonly
  return html`
    ${readonly && html`
      <input
          type=hidden
          name="${escape(name)}"
          value="${escape(prior.value)}">
    `}
    <select
        ${readonly ? 'disabled' : `name="${escape(name)}"`}
        ${required && 'required'}>
      <option value=""></option>
      ${JURISDICTIONS.map(function (jurisdiction) {
        return html`
          <option
            value="${escape(jurisdiction)}"
            ${prior && prior.value === jurisdiction && 'selected'}>
            ${escape(jurisdiction)}
          </option>
        `
      })}
    </select>
  `
}
