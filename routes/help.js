var banner = require('../partials/banner')
var etagged = require('./etagged')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = etagged('text/html; charset=ASCII', html`
${preamble('Future')}
${banner()}
${nav()}
<main>
  <h2>Help</h2>

  <p>
    For help with RxNDA, e-mail support at
    <script>
var address = ['support', 'rxnda.com'].join('@')
document.write('<a href="mailto:' + address + '">' + address + '</a>')
    </script>.
  </p>
</main>
${footer()}`)
