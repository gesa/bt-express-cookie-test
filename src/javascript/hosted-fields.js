import { client, hostedFields, threeDSecure } from 'braintree-web';
import parseQuerystring from './lib/parse-querystring';

export default function triggerHostedFields(authorization) {
  const queryString = parseQuerystring(window.location.search);
  const paymentForm = document.getElementById('hf-payment-form');
  const inputType = queryString.input || 'text';
  const expirationInputs = {
    select: {
      expirationMonth: {
        selector: '#expiration-month',
        placeholder: 'MM',
        select: {
          options: [
            '01 - January',
            '02 - February',
            '03 - March',
            '04 - April',
            '05 - May',
            '06 - June',
            '07 - July',
            '08 - August',
            '09 - September',
            '10 - October',
            '11 - November',
            '12 - December'
          ]
        }
      },
      expirationYear: {
        selector: '#expiration-year',
        placeholder: 'YY',
        select: true
      }
    },
    text: {
      expirationMonth: {
        selector: '#expiration-month',
        placeholder: 'MM'
      },
      expirationYear: {
        selector: '#expiration-year',
        placeholder: 'YY'
      }
    }
  };
  const setupFields = {
    cvv: {
      selector: '#cvv',
      placeholder: '123'
    },
    number: {
      selector: '#card-number',
      placeholder: '4111 1111 1111 1111'
    },
    postalCode: {
      selector: '#postal-code',
      placeholder: '10001'
    },
    ...expirationInputs[inputType]
  };

  client
    .create({ authorization, debug: true })
    .then(clientInstance =>
      Promise.all([
        hostedFields.create({
          client: clientInstance,
          styles: {
            input: 'form-control',
            ':focus': {
              color: 'black'
            },
            select: 'form-control'
          },
          fields: setupFields
        }),
        threeDSecure.create({
          client: clientInstance,
          version: 2
        })
      ])
    )
    .catch(console.error)
    .then(braintreeComponents => {
      const [hostedFieldsInstance, threeDSInstance] = braintreeComponents;

      hostedFieldsInstance.on('validityChange', event => {
        const { fields, emittedBy } = event;
        const { container, isPotentiallyValid, isValid } = fields[emittedBy];

        if (isValid) {
          container.classList.add('is-valid');
          container.classList.remove('is-invalid');
        } else if (isPotentiallyValid) {
          container.classList.remove('is-invalid');
          container.classList.remove('is-valid');
        } else {
          container.classList.add('is-invalid');
        }
      });

      hostedFieldsInstance.on('cardTypeChange', event => {
        const { cards } = event;

        if (cards.length === 1) {
          document.getElementById('card-type').innerText = cards[0].niceType;
        } else {
          document.getElementById('card-type').innerText = 'Card';
        }
      });

      paymentForm.addEventListener('submit', event => {
        let formIsInvalid = false;
        const { fields } = hostedFieldsInstance.getState();
        const submitButton = document.getElementById('submit-button');
        const amount = document.getElementById('amount').value;

        event.preventDefault();

        submitButton.setAttribute('disabled', 'true');

        /**
         *  Loop through the Hosted Fields and check for validity, apply the
         *  is-invalid class to the field container if invalid
         *  */
        for (let [, field] of Object.entries(fields)) {
          if (!field.isValid) {
            field.container.classList.add('is-invalid');
            formIsInvalid = true;
          }
        }

        if (formIsInvalid) {
          // skip tokenization request if any fields are invalid
          submitButton.removeAttribute('disabled');

          return;
        }

        hostedFieldsInstance
          .tokenize()
          .then(({ details: { bin }, nonce }) =>
            threeDSInstance.verifyCard({
              amount,
              version: 2,
              nonce,
              bin,
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
              },
              onLookupComplete: (data, next) => {
                // use `data` here, then call `next()`

                next();
              }
            })
          )
          .catch(console.error)
          .then(payload => {
            const { nonce, liabilityShiftPossible, liabilityShifted } = payload;

            if (liabilityShiftPossible && !liabilityShifted) {
              // ask customer for different card here
              submitButton.removeAttribute('disabled');

              return;
            }

            document.getElementById('nonce').setAttribute('value', nonce);
            paymentForm.submit();
          })
          .catch(tokenizeError => {
            console.error(tokenizeError);
            submitButton.removeAttribute('disabled');
          });
      });
    })
    .catch(console.error);
}
