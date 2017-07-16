var decodeTitle = require('../util/decode-title')
var outlineNumbering = require('outline-numbering')
var spell = require('reviewers-edition-spell')
var render = require('commonform-docx')
var docxContentType = require('docx-content-type')
var notFound = require('./not-found')
var ooxmlSignaturePages = require('ooxml-signature-pages')

module.exports = function docx (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var form = configuration.forms[title]
  if (!form) return notFound.apply(this, arguments)
  var data = form.find(function (element) {
    return element.edition === request.params.edition
  })
  if (!data) return notFound.apply(this, arguments)
  var zip = render(data.commonform, [], {
    title: title,
    edition: spell(data.edition),
    hash: true,
    numbering: outlineNumbering,
    indentMargins: true,
    centerTitle: true,
    markFilled: true,
    after: ooxmlSignaturePages(data.signatures)
  })
  response.setHeader('Content-Type', docxContentType)
  response.setHeader(
    'Content-Disposition',
    `attachment; filename="${title} ${data.edition}.docx"`
  )
  response.end(zip.generate({type: 'nodebuffer'}))
}
