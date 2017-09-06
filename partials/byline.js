var escape = require('../util/escape')
var escapeStringRegexp = require('escape-string-regexp')
var html = require('../routes/html')

var asterisk = require('./asterisk')
var paragraphs = require('./paragraphs')

module.exports = function byline (errors, side, warning, presetName) {
  return html`
<section class=field>
  <label>Signature</label>
  ${asterisk()}
  ${errors && paragraphs(errors, 'error')}
  <input
    id=signature
    class=signature
    name=signatures-${side}-signature
    type=text
    ${
      presetName &&
      `pattern="${escape(escapeStringRegexp(presetName))}"`
    }
    autocomplete=off
    required>
  <p class=description>
    To sign, enter your name again, exactly as above.
  </p>
  <p class=warning>${escape(warning)}</p>
</section>`
}
