import { BraintreeGateway, Environment } from 'braintree';
import dotenv from 'dotenv';

let localEnvironment, gateway;

dotenv.config();
localEnvironment =
  process.env.BT_ENVIRONMENT.charAt(0).toUpperCase() + process.env.BT_ENVIRONMENT.slice(1);

gateway = new BraintreeGateway({
  environment: Environment[localEnvironment],
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY
});

export default gateway;
