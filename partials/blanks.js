var html = require('../routes/html')
var list = require('english-list')
var errorsFor = require('../util/errors-for')

var input = require('./input')

module.exports = function (form, postData, priorValueOf) {
  if (form.directions.length === 0) {
    return ''
  }
  return html`
<section class=blanks>
  <h3>Fill in the Blanks</h3>
  ${form
    .directions
    .map(function (direction) {
      var name = (
        'directions-' +
        direction
          .blank
          .map(function (element) {
            return element.toString()
          })
          .join(',')
      )
      return input({
        name: name,
        required: true,
        label: direction.label,
        notes: form.notes.concat(
          direction.examples
            ? 'For example: ' + list('or',
              direction.examples.map(function (example) {
                return `“${example}”`
              })
            )
            : []
        ),
        prior: priorValueOf(direction.blank),
        errors: errorsFor(name, postData)
      })
    })}
</section>
  `
}
