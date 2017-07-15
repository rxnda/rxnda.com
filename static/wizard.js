document.addEventListener('DOMContentLoaded', function () {
  var forms = document.getElementById('forms')
  forms.addEventListener('input', onInput)
  function onInput () {
    var values = readValues()
    if (values) {
      var match = matchingForm(values)
      if (match) {
        showResult(match)
      }
    }
  }
  onInput()
})

function readValues () {
  var result = {}
  var selects = document.getElementsByTagName('select')
  for (var index = 0; index < selects.length; index++) {
    var select = selects[index]
    var value = select.value
    if (value === 'null') {
      return false
    } else {
      result[select.name] = value
    }
  }
  return result
}

function showResult (form) {
  var result = document.getElementById('result')
  window.requestAnimationFrame(function () {
    result.innerHTML = ''
    result.className = 'form'

    var h3 = document.createElement('h3')
    result.appendChild(h3)
    h3.appendChild(document.createTextNode(form.title))

    form.description.forEach(function (string) {
      var p = document.createElement('p')
      p.appendChild(document.createTextNode(string))
      result.appendChild(p)
    })

    var sendp = document.createElement('p')
    result.appendChild(sendp)
    var senda = document.createElement('a')
    sendp.appendChild(senda)
    senda.href = (
      '/send' +
      '/' + encodeURIComponent(form.title.replace(/ /g, '_')) +
      '/' + encodeURIComponent(form.edition)
    )
    senda.appendChild(document.createTextNode(
      'Prepare and send this form via rxnda.com.'
    ))

    var viewp = document.createElement('p')
    result.appendChild(viewp)
    var viewa = document.createElement('a')
    viewp.appendChild(viewa)
    viewa.href = 'https://commonform.org/forms/' + form.hash
    viewa.target = '_blank'
    viewa.appendChild(document.createTextNode(
      'Read this form on commonform.org.'
    ))
  })
}

function matchingForm (values) {
  var mapping = window.wizard.mapping
  var title = Object.keys(mapping).find(function (key) {
    var comparing = mapping[key]
    return Object.keys(comparing).every(function (comparingKey) {
      return comparing[comparingKey] === values[comparingKey]
    })
  })
  if (title) {
    return window.forms[title][0]
  }
}
