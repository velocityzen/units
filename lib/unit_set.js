'use strict';
const UnitInfo = require('./unit_info');

const UnitSet = function(loader) {
  this.loader = loader;
  this._parent = null;
  this._units = {};
};

UnitSet.prototype[Symbol.iterator] = function*() {
  yield* Object.keys(this._units);
};

UnitSet.prototype.match = function(rx, cb, ctx = this) {
  if (typeof rx === 'string') {
    rx = new RegExp(rx);
  }

  for (let key of this) {
    const match = key.match(rx);
    if (match) {
      const [ _, ...args ] = match;
      cb.apply(ctx, [ this.get(key) ].concat(args))
    }
  }
};

UnitSet.prototype.forEach = function(cb, ctx = this) {
  for (let key of this) {
    cb.call(ctx, this.get(key), key);
  }
};

UnitSet.prototype.setParent = function(parent) {
  if (this._parent) {
    throw new Error('UnitSet alredy has parent');
  }
  this._parent = parent;
};

UnitSet.prototype.alias = function(key, srcKey) {
  return this._add(key, this._units[srcKey]);
};

UnitSet.prototype.expose = function(key, obj) {
  return this._add(key, new UnitInfo(obj, this, true));
};

UnitSet.prototype.extend = function(key, obj) {
  const unit = this.get(key);

  if (!unit) {
    return this.expose(key, obj);
  }

  for (var prop in obj) {
    unit[prop] = obj[prop];
  }

  return unit;
};

UnitSet.prototype.addInitRequired = function(key, unit) {
  return this._add(key, new UnitInfo(unit, this, false, true));
};

UnitSet.prototype.add = function(arg1, arg2) {
  const type1 = typeof arg1;
  const isFunc1 = type1 === 'function';
  if ( type1 === 'object' || isFunc1) {
    const units = isFunc1 ? arg1(this) : arg1;
    units && this.addAll(units);
    return this;
  }

  if (arg2._units) {
    this.addSet(arg1, arg2);
    return this;
  }

  const type = typeof arg2;
  const isFunc2 = type === 'function';
  //if not unit and object or function that return an object
  if (!arg2.__init && (type === 'object' || isFunc2)) {
    const units = type === 'function' ? arg2(this) : arg2;

    if (units.__extend) {
      delete units.__extend;
      this.extend(arg1, units);
      return this;
    }

    if (units.__expose) {
      delete units.__expose;
      this.expose(arg1, units);
      return this;
    }

    const unitSet = new UnitSet();
    unitSet.add(units);
    this.addSet(arg1, unitSet);
    return this;
  }

  this._add(arg1, new UnitInfo(arg2, this));
  return this;
};

UnitSet.prototype.addAll = function(dict) {
  for (let key in dict) {
    this.add(key, dict[key]);
  }
};

UnitSet.prototype.addSet = function(key, unitSet, parentKey) {
  if (key && this._units[key]) {
    // if this unit is not an empty unit set throw error
    if (this._units[key].unit) {
      throw new Error('UnitSet duplicate key: ' + key);
    }

    const keyUnitSet = this.get(key);
    keyUnitSet.addSet(null, unitSet, key);
    return;
  }

  unitSet.setParent(this);
  const parent = parentKey && this._parent;
  const units = unitSet._units;
  for (let k in units) {
    let keyToAdd = this.getKeyForSet(key, k);
    this._add(keyToAdd, units[k]);
    parent && parent._add(this.getKeyForSet(parentKey, keyToAdd), units[k]);
  }

  if (key && !this._units[key]) {
    this._units[key] = new UnitInfo(null, unitSet);
  }
};

UnitSet.prototype._add = function(key, unitInfo) {
  if (this._units[key]) {
    throw new Error('UnitSet duplicate key: ' + key);
  }
  this._units[key] = unitInfo;
  return unitInfo;
};

UnitSet.prototype.joinSet = function(unitSet) {
  this.addSet(null, unitSet);
};

UnitSet.prototype.getKeyForSet = function(setKey, unitKey) {
  if (!setKey) {
    return unitKey;
  }

  return `${setKey}.${unitKey}`;
};

UnitSet.prototype.get = function(key, local, init) {
  let result = this.getLocal(key, local, init);
  if (!result) {
    result = this.getFromLoader(key, local, init);
  }

  if (!result) {
    result = this.getFromParent(key, local, init);
  }

  return result;
};

UnitSet.prototype.getLocal = function(key, local, init) {
  const unitInfo = this._units[key];
  if (unitInfo) {
    return unitInfo.get(init);
  }
};

UnitSet.prototype.getFromLoader = function(key, local, init) {
  let result;
  if (this.loader) {
    const unitToAdd = this.loader.loadUnit(key, local, init);
    if (unitToAdd) {
      const unitInfo = this._add(key, new UnitInfo(unitToAdd, this));
      // at this point units are ready to use and already inited,
      // so we need inited one too
      result = unitInfo.get(true);
    }
  }
  return result;
};

UnitSet.prototype.getFromParent = function(key, local, init) {
  if (!local && this._parent) {
    return this._parent.get(key, local, init);
  }
};

UnitSet.prototype.getInited = function(key, local) {
  return this.get(key, local, true);
};

UnitSet.prototype.require = function(key, local, init) {
  const unit = this.get(key, local, init);
  if (!unit) {
    throw new Error('Unit is required: ' + key);
  }
  return unit;
};

UnitSet.prototype.requireInited = function(key, local) {
  return this.require(key, local, true);
};

UnitSet.prototype.init = function() {
  for (let key in this._units) {
    this._units[key].init();
  }
};

module.exports = UnitSet;
