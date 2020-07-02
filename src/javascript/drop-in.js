let dropin, mountButton;

function loadDropIn(token) {
  dropin = require('braintree-web-drop-in');
  mountButton = document.getElementById('mount');

  mountButton.addEventListener('click', () => {
    if (!window.Braintree) {
      triggerDropIn(token);
      mountButton.setAttribute('disabled', 'true');
    }
  });
}

function optionBuilder(checkboxes) {
  let dropInOptions = {};

  checkboxes.forEach(el => {
    if (el.checked) {
      dropInOptions = {
        ...dropInOptions,
        ...JSON.parse(el.value)
      };
    }
  });

  return dropInOptions;
}

function triggerDropIn(authorization) {
  const form = document.getElementById('payment-form');
  const teardownButton = document.getElementById('teardown');
  const submitButton = document.getElementById('submit-button');

  dropin
    .create({
      authorization,
      container: '#bt-dropin',
      ...optionBuilder(document.querySelectorAll('[type="checkbox"][id|=with]')),
      vaultManager: true,
      preselectVaultedPaymentMethod: false
    })
    .then(instance => {
      teardownButton.removeAttribute('disabled');
      submitButton.removeAttribute('disabled');

      instance.on('paymentMethodRequestable', event => {
        console.log('paymentMethodRequestable: ', event);
      });

      instance.on('noPaymentMethodRequestable', event => {
        console.log('noPaymentMethodRequestable: ', event);
      });

      instance.on('paymentOptionSelected', event => {
        console.log('paymentOptionSelected: ', event);
      });

      teardownButton.addEventListener('click', () => {
        instance.teardown().catch(() => {
          // There is a bug in drop-in that it isn't properly tearing down 100% leading to a weird edge case that
          // throws an error on second teardown.
          window.location.reload();
        });
        mountButton.removeAttribute('disabled');
        teardownButton.setAttribute('disabled', 'true');
      });

      form.addEventListener('submit', event => {
        event.preventDefault();

        submitButton.setAttribute('disabled', 'true');

        instance
          .requestPaymentMethod({
            threeDSecure: {
              amount: document.getElementById('amount').value,
              version: 2,
              // Replace the following fields with your customer's info
              email: 'test@example.com',
              billingAddress: {
                givenName: 'Jill', // ASCII-printable characters required, else will throw a validation error
                surname: 'Doe', // ASCII-printable characters required, else will throw a validation error
                phoneNumber: '8101234567',
                streetAddress: '555 Smith St.',
                extendedAddress: '#5',
                locality: 'Oakland',
                region: 'CA',
                postalCode: '12345',
                countryCodeAlpha2: 'US'
              },
              additionalInformation: {
                workPhoneNumber: '8101234567',
                shippingGivenName: 'Jill',
                shippingSurname: 'Doe',
                shippingPhone: '8101234567',
                shippingAddress: {
                  streetAddress: '555 Smith St.',
                  extendedAddress: '#5',
                  locality: 'Oakland',
                  region: 'CA',
                  postalCode: '12345',
                  countryCodeAlpha2: 'US'
                }
              }
            }
          })
          .then(payload => {
            const { nonce, liabilityShiftPossible, liabilityShifted } = payload;

            if (liabilityShiftPossible && !liabilityShifted) {
              // ask customer for different card here

              return;
            }

            document.getElementById('nonce').value = nonce;
            form.submit();
          })
          .catch(e => {
            console.error(e);
            submitButton.removeAttribute('disabled');
          });
      });
    });
}

export { loadDropIn, triggerDropIn };
