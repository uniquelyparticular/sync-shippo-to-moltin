# @particular./sync-shippo-to-moltin

[![npm version](https://badge.fury.io/js/%40particular.%2Fsync-shippo-to-moltin.svg)](https://badge.fury.io/js/%40particular.%2Fsync-shippo-to-moltin)

> Update Moltin order shipping status when delivered in Shippo

Asynchronous microservice that is triggered by [Shippo](https://goshippo.com) webhooks to update Order data inside of [moltin](https://moltin.com).

Built with [Micro](https://github.com/zeit/micro)! 🤩

## 🛠 Setup

Both a [moltin](https://moltin.com) _and_ [Shippo](https://goshippo.com) account are needed for this to function.

Create a `.env` at the project root with the following credentials:

```dosini
MOLTIN_CLIENT_ID=
MOLTIN_CLIENT_SECRET=
```

Find your `MOLTIN_CLIENT_ID` and `MOLTIN_CLIENT_SECRET` inside of your [moltin Dashboard](https://dashboard.moltin.com)'s API keys.

## 📦 Package

Run the following command to build the app

```bash
yarn install
```

Start the development server

```bash
yarn dev
```

The server will typically start on PORT `3000`, if not, make a note for the next step.

Start ngrok (change ngrok port below from 3000 if yarn dev deployed locally on different port above)

```bash
ngrok http 3000
```

Make a note of the https `ngrok URL` provided.

## ⛽️ Usage

Next head over to the Shippo [API Settings](https://app.goshippo.com/settings/api) area, add a new webhook with the following details:

| Event Type    | Mode   | URL                 |
| ------------- | ------ | ------------------- |
| Track Updated | `Test` | _`ngrok URL` above_ |

⚠️ Each time a `charge` is `refunded` this function will be called, but it will only call moltin to update order if 'fully refunded' in Stripe (TODO: if Moltin add support for order.payment = partial_refund then can update to handle).

## 🚀 Deploy

You can easily deploy this function to [now](https://now.sh).

_Contact [Adam Grohs](https://www.linkedin.com/in/adamgrohs/) @ [Particular.](https://uniquelyparticular.com) for any questions._
