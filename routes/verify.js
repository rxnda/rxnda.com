var Busboy = require('busboy')
var ed25519 = require('../ed25519')
var pump = require('pump')
var stringify = require('json-stable-stringify')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var preamble = require('../partials/preamble')

module.exports = function (request, response) {
  if (request.method === 'POST') return post(request, response)
  get(request, response)
}

var WARNING = html`
<p class=warning>
  Digital signatures are highly precise tools.  You must enter
  the text of the signature page into this form <em>exactly</em>.
  A difference of a single character, or an extra space, will cause
  a verification failure.
</p>`

var ASTERISK = '<span class=asterisk>*</span>'

function get (request, response) {
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  response.end(html`
${preamble('Verify a Signature')}
${banner()}
${nav()}
<main>
  <h2>Verify an Electronic RxNDA Signature</h2>
  <p>
    Verify an electronic electronic signature from a fully signed RxNDA
    NDA by copying the text of the signature page into the form below.
  </p>
  ${WARNING}
  <form method=post action=/verify>
    <section class=field>
      <label for=hash>Form Code</label>
      ${ASTERISK}
      <input id=hash name=hash type=text require>
      <p class=examples>
        Enter the long string of number and letter characters at the
        top of the document.
      </p>
    </section>
    <section class=field>
      <label for=company>Company Name</label>
      <input id=company name=company type=text>
    </section>
    <section class=field>
      <label for=form>Company Legal Form</label>
      <input id=form name=form type=text>
    </section>
    <section class=field>
      <label for=jurisdiction>Company Jurisdiction</label>
      <input id=jurisdiction name=jurisdiction type=text>
    </section>
    <section class=field>
      <label for=name>Name</label>
      ${ASTERISK}
      <input id=name name=name type=text required>
    </section>
    <section class=field>
      <label for=title>Title</label>
      <input id=title name=title type=text>
    </section>
    <section class=field>
      <label for=date>Date</label>
      ${ASTERISK}
      <input id=date name=date type=text required>
      <p>
        Dates are formatted like <code>2017-08-17T07:38:54.281Z</code>.
        You must enter the date <em>exactly</em> as it appears on the
        signature page.
      </p>
    </section>
    <section class=field>
      <label for=email>E-Mail</label>
      ${ASTERISK}
      <input id=email name=email type=email required>
    </section>
    <section class=field>
      <label for=address>Address</label>
      ${ASTERISK}
      <textarea id=address name=address required></textarea>
    </section>
    <section class=field>
      <label for=signature>Signature Code</label>
      ${ASTERISK}
      <p>
        The long string of number and letter character that appears
        after the signature line.
      </p>
      <input id=signature name=signature type=text required>
    </section>
    <input type=submit value=Verify>
  </form>
</main>
${footer()}`)
}

function post (request, response) {
  var data = {}
  var signature
  var whitelist = [
    'name', 'company', 'form', 'jurisdiction', 'title',
    'date', 'email', 'address'
  ]
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        value = value.trim()
        if (value.length === 0) return
        if (whitelist.includes(name)) {
          data[name] = value
        } else if (name === 'hash') {
          data.hash = value
        } else if (name === 'signature') {
          signature = value
        }
      })
      .once('finish', function () {
        data.signature = data.name
        data.terms = 'accepted'
        request.log.info({data: data, signature: signature})
        var valid = ed25519.verify(
          stringify(data),
          signature,
          Buffer.from(process.env.PUBLIC_KEY, 'hex')
        )
        response.setHeader('Content-Type', 'text/html; charset=ASCII')
        response.end(html`
${preamble('Verify a Signature')}
${banner()}
${nav()}
<main>
  <p ${!valid && 'class=error'}>
    The signature code
    ${valid ? 'matched' : '<em>did not match</em>'}
    the signature page information you entered.
  </p>
  ${!valid && WARNING}
</main>
${footer()}`)
      })
  )
}
