var analyze = require('commonform-analyze')
var isCommonForm = require('commonform-validate').form
var revedParse = require('reviewers-edition-parse')
var sameArray = require('./same-array')
var signaturePageSchema = require('signature-page-schema')
var AJV = require('ajv')
var draft4Schema = require('ajv/lib/refs/json-schema-draft-04.json')

module.exports = function validForm (argument) {
  var ajv = new AJV()
  ajv.addMetaSchema(draft4Schema)
  return (
    // Edition
    isString(argument.edition) &&
    revedParse(argument.edition) !== false &&
    // Release Date
    !isNaN(Date.parse(argument.released)) && // valid RFC3339/ISO8601
    // Notes
    Array.isArray(argument.notes) &&
    argument.notes.length !== 0 &&
    argument.notes.every(function (element) {
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
