module.exports = function sameArray (a, b) {
  return (
    a.length === b.length &&
    a.every(function (element, index) {
      return b[index] === element
    })
  )
}
