var html = require('../routes/html')
var paragraphs = require('./paragraphs')

module.exports = function (errors) {
  return html`
<section>
  <h3>Terms of Service</h3>
  <label for=terms>
    <input type=checkbox name=terms value=accepted required>
    Check this box to show that you accept this site&rsquo;s
    <a href=/terms target=_blank>terms of service</a>.
  </label>
  ${errors && paragraphs(errors, 'error')}
</section>`
}
