'use strict';
const test = require('ava');
const Units = require('./index');

test('creates a simple unit and adds it to root unit set', t => {
  class Unit {
    init({ unit }) {
      t.is(unit, this);
    }
  }

  const units = new Units();
  units.add({ unit: new Unit() });
  units.init();
});

test('creates units from object with different types of data', t => {
  class Unit {
    init({ 'test.deep.unit': unit }) {
      t.is(unit, this);
    }
  }

  const units = new Units({
    test: {
      string: 'string',
      number: 123,
      boolean: false,
      array: [ 1, 2, 3 ],
      deep: {
        unit: new Unit()
      }
    }
  });

  units.init();

  t.is(units.require('test.string'), 'string');
  t.is(units.require('test.number'), 123);
  t.is(units.require('test.boolean'), false);
  t.deepEqual(units.require('test.array'), [ 1, 2, 3 ]);
});

test('expose object', t => {
  const units = new Units();
  const testObject = { test: 'test' };
  units.expose(testObject);
  units.init();
  t.is(units.get(), testObject);
});

test('extends undefined object', t => {
  const units = new Units();
  const testObject = { test: 'test' };
  units.extend(testObject);
  units.init();
  t.is(units.get(), testObject);
});

test('extends defined object', t => {
  const units = new Units();
  const testObject = { test: 'test' };
  units.expose(testObject);
  const extendObject = { extend: 'extend' };
  units.extend(extendObject);
  units.init();
  const obj = units.get();
  t.is(obj.test, 'test');
  t.is(obj.extend, 'extend');
});

test('all units from single configuration object', t => {
  class Unit {
    init({ 'test.unit': unit }) {
      t.is(unit, this);
    }
  }

  const units = new Units();
  units.add({
    test: {
      unit: new Unit()
    },
    expose: {
      '@expose': true,
      test1: 'test1'
    }
  });

  units.add({
    expose: {
      '@extend': true,
      test2: 'test2'
    }
  });

  units.init();
  const obj = units.require('expose');
  t.is(obj.test1, 'test1');
  t.is(obj.test2, 'test2');
});


test('fails require undefined unit', t => {
  const units = new Units();

  try {
    units.require('test');
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test('gets optional method', t => {
  class Unit {
    init({ 'notexists?': unit }) {
      t.is(unit, undefined);
    }
  }

  const units = new Units({
    test: new Unit()
  });
  units.init();
});

test('adds and require \'@\' unit and checks "instance" method', t => {
  class Unit {
    init({ 'test': unit }) {
      t.is(unit, 'test');
    }

    instance() {
      return 'test'
    }
  }

  const units = new Units({
    test: {
      '@': new Unit()
    }
  });
  units.init();

  const res = units.require('test');
  t.is(res, 'test');
});

test('adds and require \'@\' unit and checks "instance" property', t => {
  class Unit {
    constructor() {
      this.instance = 'test'
    }

    init({ 'test': unit }) {
      t.is(unit, 'test');
    }
  }

  const units = new Units({
    test: {
      '@': new Unit()
    }
  });
  units.init();

  const res = units.require('test');
  t.is(res, 'test');
});

test('adds a unit then adds another unit under the same namespace', t => {
  class Unit1 {
    constructor() {
      this.name = 'unit 1';
    }

    init({ 'test.test1': unit }) {
      t.is(unit, this);
    }
  }

  class Unit2 {
    constructor() {
      this.name = 'unit 2';
    }

    init({ 'test.test2': unit }) {
      t.is(unit, this);
    }
  }

  const units = new Units({
    test: {
      test1: new Unit1()
    }
  });
  units.add({ test: { 'test2': new Unit2() } });
  units.init();

  const res = units.require('test');
  t.true(res instanceof Units);
  t.truthy(res.get('test1'));
  t.truthy(res.get('test2'));
});

test('extends object', t => {
  const units = new Units();

  units.add({
    level1: {
      level2: {
        '@expose': true,
        test1: 'test1'
      }
    }
  });

  units.add({
    level1: {
      level2: {
        '@extend': true,
        test2: 'test2'
      }
    }
  });

  const res = units.require('level1.level2');
  t.is(res.test1, 'test1');
  t.is(res.test2, 'test2');
});

test('tests match method', t => {
  const units = new Units();
  units.add({
    level10: {
      level21: {
        level3: 'level3 string'
      },
      level22: 'level2 string'
    },

    level11: {
      level2: true
    }
  });

  units.match('(.*2$)', (unit, key) => {
    if (key === 'level10.level22') {
      t.is(unit, 'level2 string');
    }

    if (key === 'level11.level2') {
      t.is(unit, true);
    }
  });

  units.match(/3$/, unit => {
    t.is(unit, 'level3 string');
  });
});

test('tests forEach method', t => {
  const units = new Units({
    level10: {
      level21: 'level2 string',
      level22: 'level2 string'
    },

    level11: {
      level23: true
    }
  });

  t.plan(5)
  units.forEach(() => t.pass());
});

test('inits unts two times', t => {
  class Unit {
    init() {
      t.pass();
    }
  }

  t.plan(1);

  const units = new Units();
  units.add('unit', new Unit());
  units.init();
  units.init();
});

test('requires initRequired unit', t => {
  class Unit {
    constructor() {
      this.initRequired = true;
    }

    init() {
      this.inited = true;
      t.pass();
    }
  }

  t.plan(2);
  const units = new Units({
    unit: new Unit()
  });

  t.is(units.require('unit').inited, true);
  units.init();
});

test('joins two units', t => {
  const units1 = new Units({ unit1: 1 });
  const units2 = new Units({ unit2: 2 });
  units1.join(units2);
  t.is(units1.require('unit1'), 1);
  t.is(units1.require('unit2'), 2);
});

test('fails to joins two units', t => {
  const units1 = new Units({ unit: 1 });
  const units2 = new Units({ unit: 2 });

  try {
    units1.join(units2);
    t.fail();
  } catch (e) {
    t.is(e.message, 'Units duplicate key: unit')
  }
});

test('adds units to units', t => {
  const units1 = new Units();
  const units2 = new Units();
  units1.add({ units: units2 });
  t.is(units1.require('units'), units2);
});

test('adds function that returns units declaration', t => {
  const units = new Units();
  units.add(() => ({
    unit: () => ({
      deep: 'level'
    })
  }));

  t.is(units.require('unit.deep'), 'level');
});

test('checks has method', t => {
  const units = new Units({
    '@': 'self',
    test1: 'test',
    test2: false
  });

  t.true(units.has());
  t.true(units.has('test1'));
  t.true(units.has('test2'));
  t.false(units.has('non'));
});

test('checks \'@\' unit with subunits', t => {
  const units = new Units({
    root: {
      '@': 'self',
      test: {
        test1: 'test',
        test2: false
      }
    }
  });

  t.true(units.has('root'));
  t.true(units.has('root.test'));
  t.true(units.has('root.test.test1'));
  t.true(units.has('root.test.test2'));
});


test('adds a sub unit to init required unit with custom instance', t => {
  class Unit {
    constructor() {
      this.initRequired = true;
    }

    init() {
      this.inited = true;
      t.pass();
    }

    instance() {
      return { i: this.inited }
    }
  }

  class SubUnit {
    init({ test }) {
      this.inited = test.i;
      t.true(this.inited);
    }
  }

  t.plan(3);
  const units = new Units({ test: new Unit() });
  units.add({ test: { sub: new SubUnit() } })
  units.init();
  const sub = units.require('test.sub');
  t.true(sub.inited);
});

test('adds a unit and creates an alias for it', t => {
  class Unit {
    init() {
      this.inited = true;
      t.pass();
    }
  }

  t.plan(4);
  const units = new Units({ test: new Unit() });

  try {
    units.alias('alias', 'alias');
    t.fail();
  } catch (e) {
    t.pass();
  }

  try {
    units.alias('test', 'test');
    t.fail();
  } catch (e) {
    t.pass();
  }

  units.alias('alias', 'test');
  units.init();
  const test = units.require('test');
  const alias = units.require('alias');
  t.is(test, alias);
});
