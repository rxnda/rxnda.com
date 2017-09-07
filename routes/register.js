var Busboy = require('busboy')
var attorneyPath = require('../data/attorney-path')
var email = require('../email')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var pump = require('pump')
var randomCapability = require('../data/random-capability')
var registrationMessage = require('../messages/registration')
var runSeries = require('run-series')
var verifyAttorney = require('../external/verify-attorney')

var banner = require('../partials/banner')
var footer = require('../partials/footer')
var html = require('./html')
var nav = require('../partials/nav')
var paragraphs = require('../partials/paragraphs')
var preamble = require('../partials/preamble')

module.exports = function send (configuration, request, response) {
  var method = request.method
  if (method === 'GET') {
    get(configuration, request, response)
  } else if (method === 'POST') {
    post(configuration, request, response)
  } else {
    response.statusCode = 405
    response.end()
  }
}

function get (configuration, request, response, postData) {
  response.statusCode = postData ? 400 : 200
  response.setHeader('Content-Type', 'text/html; charset=ASCII')
  var MAILTO = 'register@rxnda.com?subject=Attorney%20Registration'
  var numberErrors = errorsFor('number', postData)
  var emailErrors = errorsFor('email', postData)
  var stateErrors = errorsFor('state', postData)
  var nameErrors = errorsFor('name', postData)
  response.end(html`
${preamble('Register as a Prescribing Attorney')}
${banner()}
${nav()}
<main>
  <noscript>
    <p>JavaScript has been disabled in your browser.</p>
    <p>You must enabled JavaScript to send.</p>
  </noscript>
  <form
    id=registerForm
    method=post
    action=/register>
    <h2>Register as a Prescribing Attorney</h2>

    <p>
      Register to create <em>prescriptions</em>:
      partially prefilled forms, with advice on proper use,
      that enable specific clients to send NDAs through the
      site at a substantial discount.
    </p>

    <p>
      You must be an active, licensed attorney in good
      standing to register and create prescriptions.
    </p>

    ${(postData && postData.errors) && html`
      <p class=error>
        Look below for
        ${postData.errors.length === 1 ? 'another box' : 'more boxes'}
        like this one.
      </p>
    `}

    <section class=field>
      <label>
        Jurisdiction
        <select name=state required>
          <option value=CA>California</option>
        </select>
      </label>
      ${asterisk()}
      ${stateErrors && paragraphs(stateErrors, 'error')}
      <p class=note>
        Automatic registration is only available to State
        Bar of California members at this time.
        If you're licensed in a different state,
        <a href="mailto:${MAILTO}">
          e-mail RxNDA with your name and bar number
        </a>
        to register.
      </p>
    </section>

    <section class=field>
      <label>
        Name
        <input name=name type=text required>
      </label>
      ${asterisk()}
      ${nameErrors && paragraphs(nameErrors, 'error')}
    </section>

    <section class=field>
      <label>
        Bar Number
        <input
          name=number
          type=text
          pattern="^[0-9]{6}$"
          value='${postData && postData.number}'
          required>
      </label>
      ${asterisk()}
      ${numberErrors && paragraphs(numberErrors, 'error')}
    </section>

    <section class=field>
      <label>
        E-Mail
        <input
          name=email
          type=email
          value='${postData && postData.email}'
          required>
      </label>
      ${asterisk()}
      ${emailErrors && paragraphs(emailErrors, 'error')}
      <p class=description>
        Provide the e-mail associated with your bar number
        in your state's attorney database.
      </p>
    </section>

    <input id=submitButton type=submit value=Register>
  </form>
</main>
${footer()}`)
}

function errorsFor (name, postData) {
  if (!postData || !postData.errors) {
    return []
  } else {
    return postData.errors
      .filter(function (error) {
        return error.name === name
      })
      .map(function (error) {
        return error.message
      })
  }
}

function asterisk () {
  return '<span class=asterisk>*</span>'
}

function post (configuration, request, response) {
  var data = {}
  pump(
    request,
    new Busboy({headers: request.headers})
      .on('field', function (name, value) {
        if (value) {
          value = value.trim()
          if (name === 'number') {
            data.number = value
          } else if (name === 'state') {
            data.state = value
          } else if (name === 'email') {
            data.email = value
          } else if (name === 'name') {
            data.name = value
          }
        }
      })
      .once('finish', function () {
        request.log.info({data: data})
        var errors = validPost(data)
        if (errors.length !== 0) {
          data.errors = errors
          get(configuration, request, response, data)
        } else {
          write(configuration, request, response, data)
        }
      })
  )
}

function validPost (data) {
  var errors = []
  if (!data.state) {
    errors.push({
      name: 'state',
      message: 'You must provide your state of bar membership.'
    })
  } else if (data.state !== 'CA') {
    errors.push({
      name: 'state',
      message: (
        'Automatic registration is only available to ' +
        'State Bar of California members.'
      )
    })
  }
  if (!data.name || typeof data.name !== 'string') {
    errors.push({
      name: 'name',
      message: 'You must provide your name.'
    })
  }
  if (!data.number) {
    errors.push({
      name: 'number',
      message: 'You must provide your bar number.'
    })
  } else if (!/^[0-9]{6}$/.test(data.number)) {
    errors.push({
      name: 'number',
      message: 'You must provide a valid bar number.'
    })
  }
  if (!data.email) {
    errors.push({
      name: 'email',
      message: 'You must provide your bar-registered e-mail address.'
    })
  }
  return errors
}

function write (configuration, request, response, data, form) {
  runSeries([
    function (done) {
      verifyAttorney(
        data.number, data.email,
        function (error, match, active) {
          if (error) return done(error)
          if (!match) {
            return done(
              new Error('e-mail does not match the bar database')
            )
          }
          if (!active) {
            return done(
              new Error('bar member is inactive')
            )
          }
          done()
        }
      )
    },
    function (done) {
      randomCapability(function (error, capability) {
        if (error) return done(error)
        data.capability = capability
        done()
      })
    },
    function writeFile (done) {
      var file = attorneyPath(configuration, data.capability)
      runSeries([
        mkdirp.bind(null, path.dirname(file)),
        fs.writeFile.bind(null, file, JSON.stringify(data))
      ], done)
    },
    function (done) {
      email(
        configuration,
        registrationMessage(configuration, data),
        done
      )
    }
  ], function (error) {
    /* istanbul ignore if */
    if (error) {
      request.log.error(error)
      response.statusCode = 500
      response.end()
    } else {
      response.setHeader('Content-Type', 'text/html; charset=ASCII')
      response.end(html`
${preamble()}
${banner()}
${nav()}
<main>
  <h2 class=sent>E-Mail Sent!</h2>
  <p>Please check your e-mail for a link to create prescriptions.</p>
</main>
${footer()}`)
    }
  })
}
