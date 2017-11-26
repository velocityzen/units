/*eslint consistent-this: "off"*/
'use strict';
const UNITS = Symbol('Units');
const isUnit = value => value.__init || Array.isArray(value) || typeof value !== 'object';

const Units = function(units) {
  this.inited = false;
  this[UNITS] = {};
  units && this.add(units);
}

Units.prototype.path = '.';
Units.prototype.self = '@';

Units.prototype.add = function(arg1, arg2) {
  if (arg2 === undefined) {
    return this.addObject(arg1);
  }

  // If arg1 is the units
  const units = this.getUnits(arg1);
  if (units) {
    return units.add(arg2);
  }

  // If arg2 is a units instance.
  if (arg2[UNITS]) {
    this._add(arg1, arg2);
    return this;
  }

  const type = typeof arg2;
  const isFunc2 = type === 'function';
  if (!arg2.__init && (type === 'object' || isFunc2)) {
    const units = isFunc2 ? arg2(this) : arg2;
    this._add(arg1, units);
    return this;
  }

  this._add(arg1, arg2);
  return this;
};

Units.prototype.addObject = function(obj) {
  const units = typeof obj === 'function' ? obj(this) : obj;
  if (units.__extend) {
    return this.extend(obj);
  }

  if (obj.__expose) {
    return this.expose(obj);
  }

  for (let key in units) {
    this.add(key, units[key]);
  }
  return this;
};

Units.prototype._add = function(key, obj) {
  if (this[UNITS][key]) {
    throw new Error(`Units duplicate key: ${key}`);
  }

  let units;
  if (key === this.self) {
    units = obj;
  } else if (obj instanceof Units) {
    units = obj;
    units.parent = this;
  } else {
    units = new Units();
    units.parent = this;
    if (isUnit(obj)) {
      units._add(this.self, obj);
    } else {
      units.addObject(obj);
    }
  }

  this[UNITS][key] = units;
  return this[UNITS][key];
};

Units.prototype.join = function(units) {
  for (let key in units[UNITS]) {
    this._add(key, units[UNITS][key]);
  }
};

Units.prototype.extend = function(obj) {
  delete obj.__extend;
  const unit = this[UNITS][this.self];

  if (typeof unit !== 'object') {
    return this.expose(obj);
  }

  for (let prop in obj) {
    unit[prop] = obj[prop];
  }
  return this;
};

Units.prototype.expose = function(obj) {
  delete obj.__expose;
  this._add(this.self, obj);
  return this;
};

Units.prototype.forEach = function(cb, ctx = this) {
  for (let key of this) {
    cb.call(ctx, this.get(key), key);
  }
};

Units.prototype.match = function(rx, cb, ctx = this) {
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

Units.prototype.require = function(key) {
  const unit = this.get(key);
  if (unit === undefined) {
    throw new Error('Unit is required: ' + key);
  }
  return unit;
};

Units.prototype.has = function(key = this.self) {
  return this.getUnits(key) !== undefined;
};

Units.prototype.get = function(key = this.self) {
  const units = this.getUnits(key);
  if (units !== undefined) {
    return key === this.self ? this._get() : units._get();
  }

  if (key !== this.self && this.parent) {
    return this.parent.get(key);
  }
};

Units.prototype._get = function() {
  const unit = this[UNITS][this.self];

  if (unit === undefined) {
    return this;
  }

  if (!this.inited && unit.__initRequired) {
    this.init();
  }

  if (unit.__instance) {
    return unit.__instance();
  }

  return unit;
};

Units.prototype.getUnits = function(key) {
  const path = key.split(this.path);
  let result = this;
  for (let i in path) {
    result = result[UNITS][path[i]];
    if (!result) {
      return;
    }
  }

  return result;
};

Units.prototype.init = function() {
  if (this.inited) {
    return;
  }

  this.inited = true;
  for (let key in this[UNITS]) {
    let unit = this[UNITS][key];
    if (key === this.self) {
      unit.__init && unit.__init(this);
    } else {
      this[UNITS][key].init();
    }
  }
};

Units.prototype[Symbol.iterator] = function() {
  const units = this[UNITS];
  const iter = Object.keys(units)[Symbol.iterator]();
  let childrenIter;
  let path;

  const iterator = {
    next: parent => {
      if (childrenIter) {
        const child = childrenIter.next(path);
        if (child.done) {
          childrenIter = undefined;
        } else {
          return { value: child.value };
        }
      }

      const { done, value } = iter.next();
      if (done) {
        return { done: true };
      }

      path = parent ? `${parent}.${value}` : value;

      if (value === this.self) {
        return iterator.next();
      }

      childrenIter = units[value][Symbol.iterator]();
      return { value: path };
    }
  }

  return iterator;
};

module.exports = Units;
