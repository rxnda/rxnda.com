var JURISDICTIONS = require('../data/jurisdictions')
var html = require('../routes/html')
var escape = require('../util/escape')

module.exports = function (name, required, prior) {
  return html`
    <select name="${escape(name)}" ${required && 'required'}>
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
