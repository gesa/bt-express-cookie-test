# Braintree Express Server

An example Braintree integration for Node in the Express framework.

## Setup Instructions

1. Install packages:

   ```sh
   npm install
   ```

2. Copy the contents of `example.env` into a new file named `.env` and fill in your Braintree API credentials. Credentials can be found by navigating to Account > My User > View Authorizations in the Braintree Control Panel. Full instructions can be [found on our support site](https://articles.braintreepayments.com/control-panel/important-gateway-credentials#api-credentials).

3. Start the server:

   ```sh
   npm run dev
   ```
   
   By default, this runs the app on port `3000`. You can configure the port by setting the environment variable `PORT`.

## Testing Transactions

Sandbox transactions must be made with [sample credit card numbers](https://developers.braintreepayments.com/reference/general/testing/node#credit-card-numbers), and the response of a `Transaction.sale()` call is dependent on the [amount of the transaction](https://developers.braintreepayments.com/reference/general/testing/node#test-amounts).
