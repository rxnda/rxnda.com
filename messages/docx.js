var clone = require('../data/clone')
var docx = require('commonform-docx')
var ed25519 = require('ed25519')
var ooxmlSignaturePages = require('ooxml-signature-pages')
var outlineNumbering = require('outline-numbering')
var spell = require('reviewers-edition-spell')
var stringify = require('json-stable-stringify')
var xtend = require('xtend')
var messageEMail = require('./message-email')

module.exports = function (configuration, data) {
  var sender = data.send.signatures.sender
  var recipient = xtend(
    data.send.signatures.recipient,
    data.countersign
  )
  var senderName = sender.company || sender.name
  var recipientName = recipient.company || recipient.name
  return {
    to: sender.email + ',' + recipient.email,
    subject: (
      'Signed NDA between ' + senderName + ' and ' + recipientName
    ),
    html: messageEMail(
      'Signed NDA',
      [
        `Attached please find a signed copy of the NDA ` +
        `between ${senderName} and ${recipientName}.`
      ]
    ),
    docx: {
      data: makeDOCX(configuration, data),
      name: 'NDA.docx'
    }
  }
}

function makeDOCX (configuration, data) {
  var send = data.send
  var countersign = data.countersign
  var form = data.send.form
  var zip = docx(
    form.commonform,
    send.directions,
    {
      title: form.title,
      edition: spell(form.edition),
      hash: true,
      numbering: outlineNumbering,
      indentMargins: true,
      centerTitle: true,
      markFilled: true,
      after: ooxmlSignaturePages([
        // Sender Page
        prefilledSignaturePage(
          configuration,
          form.signatures[0],
          xtend(send.signatures.sender, {date: send.timestamp})
        ),
        // Recipient Page
        prefilledSignaturePage(
          configuration,
          form.signatures[1],
          xtend(send.signatures.recipient, countersign)
        )
      ])
    }
  )
  return zip.generate({type: 'nodebuffer'})
}

function prefilledSignaturePage (configuration, page, data) {
  var returned = clone(page)
  returned.name = data.name
  returned.meta = (
    'Signed via rxnda.com. Ed25519:\n' +
    ed25519.Sign(
      Buffer.from(stringify(data), 'utf8'),
      configuration.keys.private
    ).toString('hex')
  )
  if (returned.entities) {
    returned.entities = [
      {
        name: data.company,
        jurisdiction: data.jurisdiction,
        form: data.form,
        by: data.title
      }
    ]
  }
  returned.conformed = '/' + data.signature + '/'
  // Replace information array with prefilled information object.
  returned.information = returned.information
    .reduce(function (object, key) {
      object[key] = data[key]
      return object
    }, {})
  return returned
}
