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

const handleError = (res, error) => {
  console.error(error)
  const jsonError = _toJSON(error)
  return send(
    res,
    jsonError.type === 'StripeSignatureVerificationError' ? 401 : 500,
    jsonError
  )
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
    return send(res, 200, 'ok!')
  }

  try {
    const {
      data: {
        tracking_status: { status: delivery_status },
        extra: { order_id }
      }
    } = await json(req)

    if (order_id && delivery_status === 'DELIVERED') {
      moltin.Orders.Update(order_id, {
        shipping: 'fulfilled'
      })
        .then(order => {
          console.info(order)
          return send(res, 200, JSON.stringify({ received: true }))
        })
        .catch(error => handleError(error))
    }
  } catch (error) {
    handleError(error)
  }
})
