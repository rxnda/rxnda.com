var paragraphs = require('./paragraphs')

module.exports = function payment (configuration, notes) {
  return `
    <section id=payment>
      <h3>Credit Card Payment</h3>
      <div id=card></div>
      <div id=card-errors></div>
      ${paragraphs(notes)}
    </section>`
}
