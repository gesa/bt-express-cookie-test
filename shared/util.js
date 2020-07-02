function getIntendedView(path) {
  let intendedView = path.slice(1);

  if (intendedView.endsWith('/')) {
    intendedView = intendedView.slice(0, -1);
  }

  return intendedView;
}

export { getIntendedView };
