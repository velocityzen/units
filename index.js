"use strict"
const UNITS = Symbol('Units');
const PATH = '.';
const SELF = '@';
const isUnit = value => value.__init || Array.isArray(value) || typeof value !== 'object';

class Units {
  constructor(units) {
    this.inited = false;
    this[UNITS] = {};
    units && this.add(units);
  }

  add(arg1, arg2) {
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
  }

  addObject(obj) {
    const units = typeof obj === 'function' ? obj(this) : obj;
    if (units.__extend) {
      return this.extend(obj);
    }

    if (obj.__expose) {
      return this.expose(obj);
    }

    for (const key in units) {
      this.add(key, units[key]);
    }
    return this;
  }

  _add(key, obj) {
    if (this[UNITS][key]) {
      throw new Error(`Units duplicate key: ${key}`);
    }

    let units;
    if (key === SELF) {
      units = obj;
    } else if (obj instanceof Units) {
      units = obj;
      units.parent = this;
    } else {
      units = new Units();
      units.parent = this;
      if (isUnit(obj)) {
        units._add(SELF, obj);
      } else {
        units.addObject(obj);
      }
    }

    this[UNITS][key] = units;
    return this[UNITS][key];
  }

  join(units) {
    for (const key in units[UNITS]) {
      this._add(key, units[UNITS][key]);
    }
  }

  extend(obj) {
    delete obj.__extend;
    const unit = this[UNITS][SELF];

    if (typeof unit !== 'object') {
      return this.expose(obj);
    }

    for (const prop in obj) {
      unit[prop] = obj[prop];
    }
    return this;
  }

  expose(obj) {
    delete obj.__expose;
    this._add(SELF, obj);
    return this;
  };

  forEach(cb, ctx = this) {
    for (const key of this) {
      cb.call(ctx, this.get(key), key);
    }
  }

  match(rx, cb, ctx = this) {
    if (typeof rx === 'string') {
      rx = new RegExp(rx);
    }

    for (const key of this) {
      const match = key.match(rx);
      if (match) {
        const [ _, ...args ] = match;
        cb.apply(ctx, [ this.get(key) ].concat(args))
      }
    }
  }

  require(key) {
    const unit = this.get(key);
    if (unit === undefined) {
      throw new Error('Unit is required: ' + key);
    }
    return unit;
  }

  has(key = SELF) {
    return this.getUnits(key) !== undefined;
  }

  get(key = SELF) {
    const units = this.getUnits(key);
    if (units !== undefined) {
      return key === SELF ? this._get() : units._get();
    }

    if (key !== SELF && this.parent) {
      return this.parent.get(key);
    }
  }

  _get() {
    const unit = this[UNITS][SELF];

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
  }

  getUnits(key) {
    const path = key.split(PATH);
    let result = this;
    for (const i in path) {
      result = result[UNITS][path[i]];
      if (!result) {
        return;
      }
    }

    return result;
  }

  init() {
    if (this.inited) {
      return;
    }

    this.inited = true;
    for (const key in this[UNITS]) {
      const unit = this[UNITS][key];
      if (key === SELF) {
        unit.__init && unit.__init(this);
      } else {
        this[UNITS][key].init();
      }
    }
  }

  [Symbol.iterator]() {
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

        if (value === SELF) {
          return iterator.next();
        }

        childrenIter = units[value][Symbol.iterator]();
        return { value: path };
      }
    }

    return iterator;
  }
}

module.exports = Units;
