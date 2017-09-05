var html = require('../routes/html')

var paragraphs = require('./paragraphs')

module.exports = function notes (prescription) {
  if (prescription.notes) {
    var attorney = prescription.attorney
    return html`
  <section>
    <h3>Attorney Notes</h3>
    ${paragraphs(prescription.notes.split('\n\n'))}
    <footer>
      &mdash;
      <cite>
        ${attorney.name}
        (<a href="mailto:${escape(attorney.email)}"
          >${escape(attorney.email)}</a>)
      </cite>
    </footer>
  </section>
    `
  } else {
    return ''
  }
}
