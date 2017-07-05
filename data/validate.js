var analyze = require('commonform-analyze')
var isCommonForm = require('commonform-validate').form
var revedParse = require('reviewers-edition-parse')
var sameArray = require('./same-array')
var signaturePageSchema = require('signature-page-schema')
delete signaturePageSchema.$schema
var AJV = require('ajv')

module.exports = function (argument) {
  var ajv = new AJV()
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
    isCommonForm(argument.commonform) &&
    // Fill-in-the-Blank Directions
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
    analyze(argument.commonform).blanks.every(function (formBlank) {
      return argument.directions.some(function (direction) {
        return sameArray(direction.blank, formBlank)
      })
    }) &&
    // Signature Pages
    Array.isArray(argument.signatures) &&
    argument.signatures.length === 2 &&
    argument.signatures.every(function (signaturePage) {
      return ajv.validate(signaturePageSchema, signaturePage)
    }) &&
    true
  )
}

function isString (argument) {
  return typeof argument === 'string' && argument.length !== 0
}

