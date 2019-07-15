module.exports = {
  get: (target, prop) => {
    if (prop.slice(-1) === '?') {
      return target.get(prop.slice(0, -1));
    }

    return target.require(prop);
  }
}
