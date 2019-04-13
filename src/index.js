const { json, send } = require('micro')
const { MemoryStorageFactory } = require('@moltin/sdk')
const moltinGateway = require('@moltin/sdk').gateway
const moltin = moltinGateway({
  client_id: process.env.MOLTIN_CLIENT_ID,
  client_secret: process.env.MOLTIN_CLIENT_SECRET,
  storage: new MemoryStorageFactory(),
  application: 'demo-sync-shippo-to-moltin'
})
const cors = require('micro-cors')({
  allowMethods: ['POST']
})

const _toJSON = error => {
  return !error
    ? ''
    : Object.getOwnPropertyNames(error).reduce(
        (jsonError, key) => {
          return { ...jsonError, [key]: error[key] }
        },
        { type: 'error' }
      )
}

const _toLowercase = string => {
  return !string ? '' : string.toLocaleLowerCase()
}

process.on('unhandledRejection', (reason, p) => {
  console.error(
    'Promise unhandledRejection: ',
    p,
    ', reason:',
    JSON.stringify(reason)
  )
})

module.exports = cors(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 204)
  }

  /*
  "carrier": "usps",
  "tracking_number": "9205590164917312751089",
  "address_from": {
    "city": "Las Vegas",
    "state": "NV",
    "zip": "89101",
    "country": "US"
  },
  "address_to": {
    "city": "Spotsylvania",
    "state": "VA",
    "zip": "22551",
    "country": "US"
  },
  "transaction": "1275c67d754f45bf9d6e4d7a3e205314",
  "original_eta": "2016-07-23T00:00:00Z",
  "eta": "2016-07-23T00:00:00Z",
  "servicelevel": {
    "token": "usps_priority",
    "name": "Priority Mail"
  },
  "metadata": null,
  "tracking_status": {
    "object_created": "2016-07-23T20:35:26.129Z",
    "object_updated": "2016-07-23T20:35:26.129Z",
    "object_id": "ce48ff3d52a34e91b77aa98370182624",
    "status": "DELIVERED",
    "status_details": "Your shipment has been delivered at the destination mailbox.",
    "status_date": "2016-07-23T13:03:00Z",
    "location": {
      "city": "Spotsylvania",
      "state": "VA",
      "zip": "22551",
      "country": "US"
    }
  },
  */

  try {
    const tracking_update = await json(req)
    const {
      data: {
        tracking_status: { status }
      }
    } = tracking_update

    let tracking_extra = {}
    if (tracking_update.extra) {
      tracking_extra = tracking_update.extra
    }
    const { order_id } = tracking_extra
    // let { order_id } = tracking_extra

    // if (!order_id) {
    //   order_id = '730589c9-ee68-44b4-a201-bb38a9468abe'
    // }

    if (order_id) {
      if (_toLowercase(status) === 'delivered') {
        moltin.Orders.Update(order_id, {
          shipping: 'fulfilled'
        })
          .then(order => {
            console.info(order)
            return send(res, 200, JSON.stringify({ received: true, order_id }))
          })
          .catch(error => {
            const jsonError = _toJSON(error)
            return send(
              res,
              jsonError.errors[0].status ? jsonError.errors[0].status : 500,
              jsonError
            )
          })
      } else {
        return send(res, 200, JSON.stringify({ received: true, order_id }))
      }
    } else {
      console.error('missing order_id')
      return send(
        res,
        200,
        JSON.stringify({ received: true, order_id: 'null' })
      )
    }
  } catch (error) {
    const jsonError = _toJSON(error)
    return send(res, 500, jsonError)
  }
})
