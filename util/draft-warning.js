module.exports = function draftWarning (edition) {
  if (edition.edition.endsWith('d')) {
    return `
<p class=warning>
  This is a draft form, not a final edition.  You should
  use a final edition unless you have a specific reason
  to prefer this draft.
</p>`
  } else {
    return ''
  }
}
