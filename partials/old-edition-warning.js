var escape = require('../util/escape')
var revedCompare = require('reviewers-edition-compare')
var spell = require('reviewers-edition-spell')

module.exports = function draftWarning (
  title, thisEdition, allEditions, makeHREF
) {
  allEditions.sort(revedCompare).reverse()
  var latestEdition = allEditions[0]
  if (thisEdition !== latestEdition) {
    var href = makeHREF
      ? makeHREF(title, latestEdition)
      : '/forms/' + escape(title) + '/' + escape(latestEdition)
    return `
<p class=warning>
  This is an old edition of form <code>${escape(title)}</code>.
  The latest edition is the
  <a href=${href}>${escape(spell(latestEdition))}</a>.
</p>`
  }
  return ''
}
