var escape = require('../util/escape')
var html = require('../routes/html')

module.exports = function (items) {
  return html`
<section class=information>
  <h3>Next Steps</h3>
  <p>When you press Sign &amp; Send:</p>
  <ol>
    ${items.map(function (item) {
      return html`<li>${escape(item)}</li>`
    })}
  </ol>
</section>
  `
}
