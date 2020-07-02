import { Router } from 'express';
import { Transaction } from 'braintree';
import { debug as logger } from 'debug';
import gateway from './lib/gateway';
import { getIntendedView } from '../shared/util';

const router = Router(); // eslint-disable-line new-cap
const debug = logger('braintree:router');
const TRANSACTION_SUCCESS_STATUSES = [
  Transaction.Status.Authorizing,
  Transaction.Status.Authorized,
  Transaction.Status.Settled,
  Transaction.Status.Settling,
  Transaction.Status.SettlementConfirmed,
  Transaction.Status.SettlementPending,
  Transaction.Status.SubmittedForSettlement
];

function formatErrors(errors) {
  let formattedErrors = '';

  for (let [, error] of Object.entries(errors)) {
    formattedErrors += `Error: ${error.code}: ${error.message}
`;
  }

  return formattedErrors;
}

function createResultObject({ status }) {
  let result;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message:
        'Your test transaction has been successfully processed. See the Braintree API response and try again.'
    };
  } else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: `Your test transaction has a status of ${status}. See the Braintree API response and try again.`
    };
  }

  return result;
}

router.get(['/', '/checkouts/new'], (req, res) => {
  res.redirect('/checkouts/drop-in');
});

router.get(['/checkouts/drop-in', '/checkouts/hosted-fields'], (req, res) => {
  let inputType = 'text';
  const {
    query: { input }
  } = req;

  if (input) {
    inputType = input;
  }

  gateway.clientToken.generate({}, (err, response) => {
    res.render(getIntendedView(req.path), {
      clientToken: response.clientToken,
      messages: req.flash('error'),
      inputType
    });
  });
});

router.get('/checkouts/:id', (req, res) => {
  let result;
  const {
    query: { returnTo },
    params: { id: transactionId }
  } = req;

  gateway.transaction
    .find(transactionId)
    .then(transaction => {
      result = createResultObject(transaction);
      res.render('checkouts/show', {
        transaction,
        result,
        returnTo: returnTo ? returnTo : '/'
      });
    })
    .catch(err => {
      req.flash('error', { msg: formatErrors(err) });
    });
});

router.post('/checkouts', (req, res) => {
  let transactionErrors;
  const {
    body: { amount, nonce: paymentMethodNonce, integration }
  } = req;

  gateway.transaction
    .sale({
      amount, // In production you should not take amounts directly from clients
      paymentMethodNonce,
      options: {
        submitForSettlement: true
      }
    })
    .catch(err => {
      debug('err object from transaction.sale %O', err);
    })
    .then(result => {
      const { success, transaction, errors } = result;

      if (success || transaction) {
        res.redirect(
          `checkouts/${transaction.id}` + (integration ? `?returnTo=checkouts/${integration}` : '/')
        );
      } else {
        transactionErrors = errors.deepErrors();
        req.flash('error', { msg: formatErrors(transactionErrors) });
        debug(formatErrors(transactionErrors));
        res.redirect('back');
      }
    });
});

export default router;
