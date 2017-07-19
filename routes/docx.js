var decodeTitle = require('../util/decode-title')
var docxContentType = require('docx-content-type')
var notFound = require('./not-found')
var ooxmlSignaturePages = require('ooxml-signature-pages')
var outlineNumbering = require('outline-numbering')
var readEdition = require('../data/read-edition')
var render = require('commonform-docx')
var revedParse = require('reviewers-edition-parse')
var sanitize = require('../util/sanitize-path-component')
var spell = require('reviewers-edition-spell')

module.exports = function docx (configuration, request, response) {
  var title = decodeTitle(request.params.title)
  var edition = request.params.edition
  if (!revedParse(edition)) {
    return notFound.apply(null, arguments)
  }
  readEdition(
    configuration, sanitize(title), sanitize(edition),
    function (error, data) {
      if (error) {
        notFound(configuration, request, response)
      } else if (data === false) {
        notFound(configuration, request, response)
      } else {
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
    }
  )
}
