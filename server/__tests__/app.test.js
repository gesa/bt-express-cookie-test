import request from 'supertest';
import gateway from '../lib/gateway';
import app from '../app';

const api = request(app);

describe('Checkout index page', () => {
  it('redirects to the checkouts drop-in page', () =>
    api
      .get('/')
      .expect('location', '/checkouts/drop-in')
      .expect(302));

  it('responds with 200', () => api.get('/checkouts/drop-in').expect(200));

  it('generates a client token', () =>
    api
      .get('/checkouts/drop-in')
      .then(res => expect(res.text).toMatch(/<span hidden id="client-token">[\w=]+<\/span>/)));

  it('includes the checkout form', () =>
    api.get('/checkouts/drop-in').then(res => expect(res.text).toMatch(/<form id="payment-form"/)));

  it('includes the dropin div', () =>
    api.get('/checkouts/drop-in').then(res => expect(res.text).toMatch(/<div id="bt-dropin"/)));

  it('includes the amount field', () =>
    api.get('/checkouts/drop-in').then(res => {
      expect(res.text).toMatch(/<label for="amount/);
      expect(res.text).toMatch(
        /<input class="form-control" id="amount" name="amount" type="tel" min="1" value="10">/
      );
    }));
});

describe('Checkouts show page', () => {
  it('respond with 200', () =>
    gateway.transaction
      .sale({
        amount: '10.00',
        paymentMethodNonce: 'fake-valid-nonce',
        options: {
          submitForSettlement: true
        }
      })
      .then(result => api.get(`/checkouts/${result.transaction.id}`))
      .then(({ statusCode }) => expect(statusCode).toBe(200)));

  it("displays the transaction's fields", () => {
    let transaction;

    return gateway.transaction
      .sale({
        amount: '10.00',
        paymentMethodNonce: 'fake-valid-nonce',
        options: {
          submitForSettlement: true
        }
      })
      .then(result => {
        transaction = result.transaction;

        return api.get(`/checkouts/${transaction.id}`);
      })
      .then(res => {
        const { text } = res;
        const { id, type, amount, status, creditCard } = transaction;

        expect(text).toMatch(id);
        expect(text).toMatch(type);
        expect(text).toMatch(amount);
        expect(text).toMatch(status);
        expect(text).toMatch(creditCard.bin);
        expect(text).toMatch(creditCard.last4);
        expect(text).toMatch(creditCard.cardType);
        expect(text).toMatch(creditCard.expirationDate);
        expect(text).toMatch(creditCard.customerLocation);
      });
  });

  it('displays a success page when transaction succeeded', () =>
    gateway.transaction
      .sale({
        amount: '11.00',
        paymentMethodNonce: 'fake-valid-nonce',
        options: {
          submitForSettlement: true
        }
      })
      .then(result => api.get(`/checkouts/${result.transaction.id}`))
      .then(({ text }) => expect(text).toMatch('Sweet Success!')));

  it('displays a failure page when transaction failed', () =>
    gateway.transaction
      .sale({
        amount: '2000.00',
        paymentMethodNonce: 'fake-valid-nonce',
        options: {
          submitForSettlement: true
        }
      })
      .then(result => api.get(`/checkouts/${result.transaction.id}`))
      .then(({ text }) => {
        expect(text).toMatch('Transaction Failed');
        expect(text).toMatch('Your test transaction has a status of processor_declined');
      }));
});

describe('Checkouts create', () => {
  it('creates a transaction and redirects to checkout show', () =>
    api
      .post('/checkouts')
      .send({
        amount: '10.00',
        nonce: 'fake-valid-nonce'
      })
      .expect(302)
      .expect('location', /^checkouts\/[\w]{8}\/?$/));

  describe('when the transaction is not successful', () => {
    describe('when braintree returns an error', () => {
      it('redirects to the drop-in checkout page if transaction is not created', () =>
        api
          .post('/checkouts')
          .set({ referer: '/checkouts/drop-in' })
          .send({
            amount: 'not_a_valid_amount',
            nonce: 'not_a_valid_nonce'
          })
          .expect(302)
          .expect('location', '/checkouts/drop-in'));

      it('displays errors for invalid amount', () =>
        api
          .post('/checkouts')
          .send({
            amount: 'not_a_valid_amount',
            nonce: 'fake-valid-nonce'
          })
          .then(res => {
            const req = api.get('/checkouts/drop-in');
            const cookie = res.headers['set-cookie'];

            req.set('Cookie', cookie);

            return req;
          })
          .then(({ text }) => expect(text).toMatch('Error: 81503: Amount is an invalid format.')));

      it('displays errors for invalid nonce', () =>
        api
          .post('/checkouts')
          .send({
            amount: '10.00',
            nonce: 'not_a_valid_nonce'
          })
          .then(res => {
            const req = api.get('/checkouts/drop-in');
            const cookie = res.headers['set-cookie'];

            req.set('Cookie', cookie);

            return req;
          })
          .then(({ text }) =>
            expect(text).toMatch('Error: 91565: Unknown or expired payment_method_nonce.')
          ));
    });

    describe('when there are processor errors', () => {
      it('redirects to the checkouts show page', () =>
        api
          .post('/checkouts')
          .send({
            amount: '10.00',
            nonce: 'fake-valid-nonce'
          })
          .expect(302)
          .expect('location', /^\/?checkouts\/[\w]{8}\/?$/));

      it('displays the transaction status', () =>
        api
          .post('/checkouts')
          .send({
            amount: '2000.00',
            nonce: 'fake-valid-nonce'
          })
          .then(res => {
            const redirectUrl = `/${res.req.res.headers.location}`;
            const req = api.get(redirectUrl);
            const cookie = res.headers['set-cookie'];

            req.set('Cookie', cookie);

            return req;
          })
          .then(({ text }) =>
            expect(text).toMatch('Your test transaction has a status of processor_declined')
          ));
    });
  });
});
