var escape = require('./escape')

module.exports = function paragraphs (array, className) {
  className = className || 'note'
  return array
    .map(function (element) {
      return `<p class=${className}>${escape(element)}</p>`
    })
    .join('')
}
