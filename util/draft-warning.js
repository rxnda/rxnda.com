module.exports = function draftWarning (edition) {
  if (edition.edition.endsWith('d')) {
    return `
<p class=warning>
  This is a draft form, not a final edition.  Unless you
  have a specific reason to prefer this draft, you should
  use a final edition instead.
</p>`
  } else {
    return ''
  }
}
