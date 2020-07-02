export default function parseQuerystring() {
  const queryString = window.location.search.substring(1);
  const kvPairs = [];
  let kvStrings;

  if (queryString.length === 0) { return false; }

  kvStrings = queryString.split('&');

  kvStrings.forEach(kvString => {
    if (kvString.indexOf('=') > -1) { kvPairs.push(kvString.split('=')); }

    kvPairs.push([kvString, '']);
  });

  return Object.fromEntries(kvPairs);
}
