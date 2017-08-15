'use strict';
const test = require('ava');
const UnitSet = require('./lib/unit_set');

test.cb('creates a simple unit and adds it to root unit set', t => {
  const root = new UnitSet();
  const Unit = function() {};
  Unit.prototype.__init = function(units) {
    t.is(units.require('unit'), this);
    t.end();
  };

  root.add('unit', new Unit());
  root.init();
});

test.cb('creates a units structure with a simple unit and adds it to root unit set', t => {
  const root = new UnitSet();
  const Unit = function() {};
  Unit.prototype.__init = function(units) {
    t.is(units.require('test.unit'), this);
    t.end();
  };

  root.add({
    test: { unit: new Unit() }
  });
  root.init();
});

test('expose object', t => {
  const root = new UnitSet();
  const testObject = { test: 'test' };
  root.expose('object', testObject);
  root.init();
  t.is(root.require('object'), testObject);
});

test('extends undefined object', t => {
  const root = new UnitSet();
  const testObject = { test: 'test' };
  root.extend('object', testObject);
  root.init();
  t.is(root.require('object'), testObject);
});

test('extends defined object', t => {
  const root = new UnitSet();
  const testObject = { test: 'test' };
  root.expose('object', testObject);
  const extendObject = { extend: 'extend' };
  root.extend('object', extendObject);

  root.init();
  const obj = root.require('object');
  t.is(obj.test, 'test');
  t.is(obj.extend, 'extend');
});

test('all units from single configuration object', t => {
  const root = new UnitSet();
  const Unit = function() {};
  Unit.prototype.__init = function(units) {
    t.is(units.require('test.unit'), this);
  };

  root.add({
    test: {
      unit: new Unit()
    },
    expose: {
      __expose: true,
      test1: 'test1'
    }
  });

  root.add({
    expose: {
      __extend: true,
      test2: 'test2'
    }
  });

  root.init();
  const obj = root.require('expose');
  t.is(obj.test1, 'test1');
  t.is(obj.test2, 'test2');
});


test('fails require undefined unit', t => {
  const root = new UnitSet();

  try {
    root.require('test');
    t.fail();
  } catch (e) {
    t.pass();
  }
});
