var anniversary = require('anniversary')
var clone = require('../data/clone')
var docx = require('commonform-docx')
var ed25519 = require('ed25519')
var hash = require('commonform-hash')
var icalDate = require('../util/ical-date')
var messageEMail = require('./message-email')
var ooxmlSignaturePages = require('ooxml-signature-pages')
var outlineNumbering = require('outline-numbering')
var spell = require('reviewers-edition-spell')
var stringify = require('json-stable-stringify')
var uuid = require('uuid')
var xtend = require('xtend')

module.exports = function (configuration, data) {
  var sender = data.send.signatures.sender
  var recipient = xtend(
    data.send.signatures.recipient,
    data.countersign
  )
  var senderName = sender.company || sender.name
  var recipientName = recipient.company || recipient.name
  var expirationDate = anniversary(new Date(data.countersign.date))
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
    },
    // TODO: Add manifest flag for NDAs that don't expire in one year.
    ics: Buffer.from([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + uuid(),
      'DTSTAMP:' + icalDate(new Date()),
      'DTSTART:' + icalDate(expirationDate),
      'DTEND:' + icalDate(expirationDate),
      'SUMMARY:Expiration of NDA between ' +
      senderName + ' and ' + recipientName,
      'DESCRIPTION:Consider renewing the NDA before it expires.',
      'STATUS:confirmed',
      'ATTENDEE;CN=' + senderName + ':mailto:' + sender.email,
      'ATTENDEE;CN=' + recipientName + ':mailto:' + recipient.email,
      'BEGIN:VALARM',
      'ACTION:EMAIL',
      'TRIGGER:-P30D',
      'DESCRIPTION:Consider renewing the NDA before it expires in thirty days.',
      'SUMMARY:Expiration of NDA between Alice Sender and Bob',
      'ATTENDEE:mailto:' + sender.email,
      'ATTENDEE:mailto:' + recipient.email,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n'))
  }
}

function makeDOCX (configuration, data) {
  var send = data.send
  var countersign = data.countersign
  var form = data.send.form
  var formHash = hash(form.commonform)
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
          formHash,
          form.signatures[0],
          xtend(send.signatures.sender, {date: send.timestamp})
        ),
        // Recipient Page
        prefilledSignaturePage(
          configuration,
          formHash,
          form.signatures[1],
          xtend(send.signatures.recipient, countersign)
        )
      ])
    }
  )
  return zip.generate({type: 'nodebuffer'})
}

function prefilledSignaturePage (configuration, hash, page, data) {
  var returned = clone(page)
  returned.name = data.name
  returned.meta = (
    'rxnda.com signature code:\n' +
    ed25519.Sign(
      Buffer.from(stringify(xtend(data, {hash: hash})), 'utf8'),
      configuration.keys.private
    ).toString('hex') + '\n' +
    'Verify online at https://rxnda.com/verify.'
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
