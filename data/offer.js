var cancelMessage = require('../messages/cancel')
var cancelPath = require('../data/cancel-path')
var chargePath = require('../data/charge-path')
var countersignMessage = require('../messages/countersign')
var deleteCoupon = require('../data/delete-coupon')
var email = require('../email')
var mkdirpThenWriteJSON = require('../data/mkdirp-then-write-json')
var randomCapability = require('../data/random-capability')
var readCoupon = require('../data/read-coupon')
var runParallel = require('run-parallel')
var runSeries = require('run-series')
var signPath = require('../data/sign-path')
var stripe = require('stripe')

module.exports = function (configuration, request, data, callback) {
  var domain = configuration.domain
  runSeries([
    function generateCapabilities (done) {
      runParallel([
        capabilityToProperty(data, 'cancel'),
        capabilityToProperty(data, 'sign')
      ], done)
    },
    function handlePayment (done) {
      var chargeID = null
      runSeries([
        function createCharge (done) {
          if (data.prescriptionCoupon) {
            done()
          } else if (data.coupon) {
            var coupon = data.coupon
            readCoupon(configuration, coupon, function (error, valid) {
              if (error) {
                chargeID = 'coupon'
                done(error)
              } else if (valid) {
                chargeID = 'coupon'
                deleteCoupon(configuration, coupon, done)
              } else {
                done(new Error('invalid coupon'))
              }
            })
          } else {
            stripe(configuration.stripe.private).charges.create({
              amount: data.price * 100, // dollars to cents
              currency: 'usd',
              description: domain,
              // Important: Authorize, but don't capture/charge yet.
              capture: false,
              source: data.token
            }, function (error, charge) {
              if (error) return done(error)
              chargeID = charge.id
              request.log.info({charge: chargeID})
              done()
            })
          }
        },
        function writeChargeFile (done) {
          mkdirpThenWriteJSON(
            chargePath(configuration, data.sign), chargeID, done
          )
        }
      ], done)
    },
    function writeFiles (done) {
      runParallel([
        function writeCancelFile (done) {
          mkdirpThenWriteJSON(
            cancelPath(configuration, data.cancel), data.sign, done
          )
        },
        function writeSignFile (done) {
          mkdirpThenWriteJSON(
            signPath(configuration, data.sign), data, done
          )
        }
      ], done)
    },
    function sendEmails (done) {
      runSeries([
        function emailCancelLink (done) {
          email(
            configuration,
            cancelMessage(configuration, data),
            done
          )
        },
        function emailSignLink (done) {
          email(
            configuration,
            countersignMessage(configuration, data),
            done
          )
        }
      ], done)
    }
  ], callback)

  function capabilityToProperty (object, key) {
    return function (done) {
      randomCapability(function (error, capability) {
        if (error) return done(error)
        var logObject = {}
        logObject[key] = object[key] = capability
        request.log.info(logObject)
        done()
      })
    }
  }
}
