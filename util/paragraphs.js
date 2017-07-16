var escape = require('escape-html')

module.exports = function paragraphs (array, className) {
  className = className || 'note'
  return array
    .map(function (element) {
      return `<p class=${className}>${escape(element)}</p>`
    })
    .join('')
}
