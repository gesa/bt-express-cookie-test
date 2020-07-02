import triggerHostedFields from './hosted-fields';
import { loadDropIn } from './drop-in';
import { getIntendedView } from '../../shared/util';

const clientToken = document.getElementById('client-token').innerText;
const currentIntegration = getIntendedView(window.location.pathname).split('/')[1];

switch (currentIntegration) {
  case 'hosted-fields':
    document.addEventListener('DOMContentLoaded', () => {
      triggerHostedFields(clientToken);
    });
    break;
  case 'drop-in':
    document.addEventListener('DOMContentLoaded', () => {
      loadDropIn(clientToken);
    });
    break;
  default:
}
