var revedParse = require('reviewers-edition-parse')
var isCommonForm = require('commonform-validate').form
var analyze = require('commonform-analyze')

module.exports = function (argument) {
  return (
    // Title
    isString(argument.title) &&
    // Edition
    isString(argument.edition) &&
    revedParse(argument.edition) !== false &&
    // Release Date
    !isNaN(Date.parse(argument.released)) && // valid RFC3339/ISO8601
    // Description
    Array.isArray(argument.description) &&
    argument.description.length !== 0 &&
    argument.description.every(function (element) {
      return isString(element)
    }) &&
    // Repository
    isString(argument.repository) &&
    // Form Content
    isCommonForm(argument.form) &&
    argument.directions.every(function (direction) {
      return (
        Array.isArray(direction.blank) &&
        isString(direction.label) &&
        Array.isArray(direction.notes) &&
        direction.notes.every(function (note) {
          return isString(note)
        })
      )
    }) &&
    analyze(argument.form).blanks.every(function (formBlank) {
      return argument.directions.some(function (direction) {
        return sameArray(direction.blank, formBlank)
      })
    })
  )
}

function isString (argument) {
  return typeof argument === 'string' && argument.length !== 0
}

function sameArray (a, b) {
  return (
    a.length === b.length &&
    a.every(function (element, index) {
      return b[index] === element
    })
  )
}
