'use strict';
const test = require('ava');
const Units = require('./index');

test('creates a simple unit and adds it to root unit set', t => {
  const units = new Units();
  const Unit = function() {};
  Unit.prototype.__init = function(units) {
    t.is(units.require('unit'), this);
  };

  units.add('unit', new Unit());
  units.init();
});

test('creates units from object with different types of data', t => {
  const units = new Units();
  const Unit = function() {};
  Unit.prototype.__init = function(units) {
    t.is(units.require('test.deep.unit'), this);
  };

  units.add({
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
  const units = new Units();
  const Unit = function() {};
  Unit.prototype.__init = function(units) {
    t.is(units.require('test.unit'), this);
  };

  units.add({
    test: {
      unit: new Unit()
    },
    expose: {
      __expose: true,
      test1: 'test1'
    }
  });

  units.add({
    expose: {
      __extend: true,
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

test('adds and require \'@\' unit and checks __instance method', t => {
  const units = new Units();
  const Unit = function() {
    this.name = 'test unit';
  };
  Unit.prototype = {
    __init: function(units) {
      t.is(units.require('test'), 'test');
    },
    __instance: function() {
      return 'test'
    }
  };

  units.add({
    test: {
      '@': new Unit()
    }
  });

  units.init();
  const res = units.require('test');
  t.is(res, 'test');
});

test('adds a unit then adds another unit under the same namespace', t => {
  const units = new Units();
  const Unit1 = function() {
    this.name = 'unit 1';
  };
  Unit1.prototype = {
    __init: function(units) {
      t.is(units.require('test.test1'), this);
    }
  };

  const Unit2 = function() {
    this.name = 'unit 2';
  };
  Unit2.prototype = {
    __init: function(units) {
      t.is(units.require('test.test2'), this);
    }
  };

  units.add('test', { 'test1': new Unit1() });
  units.add('test', { 'test2': new Unit2() });
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
        __expose: true,
        test1: 'test1'
      }
    }
  });

  units.add({
    level1: {
      level2: {
        __extend: true,
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
  units.forEach(() => {
    t.pass();
  });
});

test('inits unts two times', t => {
  const units = new Units();
  const Unit = function() {};
  Unit.prototype.__init = function() {
    t.pass();
  };

  t.plan(1);
  units.add('unit', new Unit());
  units.init();
  units.init();
});

test('requires initRequired unit', t => {
  const units = new Units();
  const Unit = function() {};
  Unit.prototype.__initRequired = true;
  Unit.prototype.__init = function() {
    this.inited = true;
    t.pass();
  };

  t.plan(2);
  units.add('unit', new Unit());
  t.is(units.require('unit').inited, true);
  units.init();
});

test('joins two units', t => {
  const units1 = new Units();
  const units2 = new Units();
  units1.add('unit1', 1);
  units2.add('unit2', 2);
  units1.join(units2);
  t.is(units1.require('unit1'), 1);
  t.is(units1.require('unit2'), 2);
});

test('fails to joins two units', t => {
  const units1 = new Units();
  const units2 = new Units();
  units1.add('unit', 1);
  units2.add('unit', 2);

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
  units1.add('units', units2);
  t.is(units1.require('units'), units2);
});

test('adds function that returns units declaration', t => {
  const units = new Units();
  units.add(u => {
    t.is(u, units);
    return {
      unit: () => ({
        deep: 'level'
      })
    }
  });

  t.is(units.require('unit.deep'), 'level');
});

test('check has method', t => {
  const units = new Units({
    '@': 'self',
    test1: 'test',
    test2: false
  });

  t.true(units.has());
  t.true(units.has('test1'));
  t.true(units.has('test2'));
  t.false(units.has('non'));
})
