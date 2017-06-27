'use strict';
const UnitInfo = require('./unit_info');

const UnitSet = function(loader) {
  this.loader = loader;
  this.parent = null;
  this.unitInfoDict = {};
};

UnitSet.prototype[Symbol.iterator] = function*() {
  yield* Object.keys(this.unitInfoDict);
};

UnitSet.prototype.match = function(rx, cb) {
  if (typeof rx === 'string') {
    rx = new RegExp(rx);
  }

  for (let key of this) {
    const match = key.match(rx);
    if (match) {
      const [ _, ...args ] = match;
      cb.apply(this, [ this.get(key) ].concat(args))
    }
  }
};

UnitSet.prototype.setParent = function(parent) {
  if (this.parent) {
    throw new Error('UnitSet alredy has parent');
  }
  this.parent = parent;
};

UnitSet.prototype.alias = function(key, srcKey) {
  return this.addInternal(key, this.unitInfoDict[srcKey]);
};

UnitSet.prototype.expose = function(key, unit) {
  return this.addInternal(key, new UnitInfo(unit, this, true));
};

UnitSet.prototype.addInitRequired = function(key, unit) {
  return this.addInternal(key, new UnitInfo(unit, this, false, true));
};

UnitSet.prototype.add = function(arg1, arg2) {
  if (typeof arg1 === 'object') {
    this.addAll(arg1);
    return this;
  }

  if (arg2.unitInfoDict) {
    this.addSet(arg1, arg2);
    return this;
  }

  const type = typeof arg2;
  if (!arg2.unitInit && (type === 'object' || type === 'function')) {
    const newUnitSet = new UnitSet();
    newUnitSet.add(type === 'function' ? arg2() : arg2);
    this.addSet(arg1, newUnitSet);
    return this;
  }

  this.addInternal(arg1, new UnitInfo(arg2, this));
  return this;
};

UnitSet.prototype.joinSet = function(unitSet) {
  this.addSet(null, unitSet);
};

UnitSet.prototype.addAll = function(dict) {
  for (let key in dict) {
    this.add(key, dict[key]);
  }
};

UnitSet.prototype.addSet = function(key, unitSet, parentKey) {
  if (key && this.unitInfoDict[key]) {
    // if this unit is not an empty unit set throw error
    if (this.unitInfoDict[key].unit) {
      throw new Error('UnitSet duplicate key: ' + key);
    }

    const keyUnitSet = this.get(key);
    keyUnitSet.addSet(null, unitSet, key);
    return;
  }

  unitSet.setParent(this);
  const parent = parentKey && this.parent;
  const setUnitInfoDict = unitSet.unitInfoDict;
  for (let k in setUnitInfoDict) {
    let keyToAdd = this.getKeyForSet(key, k);
    this.addInternal(keyToAdd, setUnitInfoDict[k]);
    parent && parent.addInternal(this.getKeyForSet(parentKey, keyToAdd), setUnitInfoDict[k]);
  }
  if (key && !this.unitInfoDict[key]) {
    this.unitInfoDict[key] = new UnitInfo(null, unitSet);
  }
};

UnitSet.prototype.addInternal = function(key, unitInfo) {
  if (this.unitInfoDict[key]) {
    throw new Error('UnitSet duplicate key: ' + key);
  }
  this.unitInfoDict[key] = unitInfo;
  return unitInfo;
};

UnitSet.prototype.getKeyForSet = function(setKey, unitKey) {
  if (unitKey === '~' && setKey) {
    return setKey;
  }

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
  const unitInfo = this.unitInfoDict[key];
  if (unitInfo) {
    return unitInfo.getPreparedUnit(init);
  }
};

UnitSet.prototype.getFromLoader = function(key, local, init) {
  let result;
  if (this.loader) {
    const unitToAdd = this.loader.loadUnit(key, local, init);
    if (unitToAdd) {
      const unitInfo = this.addInternal(key, new UnitInfo(unitToAdd, this));
      // at this point units are ready to use and already inited,
      // so we need inited one too
      result = unitInfo.getPreparedUnit(true);
    }
  }
  return result;
};

UnitSet.prototype.getFromParent = function(key, local, init) {
  if (!local && this.parent) {
    return this.parent.get(key, local, init);
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
  for (let key in this.unitInfoDict) {
    this.unitInfoDict[key].init();
  }
};

module.exports = UnitSet;
