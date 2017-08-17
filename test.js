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

test('adds and require \'~\' unit', t => {
  const root = new UnitSet();
  const Unit = function() {};
  Unit.prototype = {
    __init: function(units) {
      t.is(units.require('test'), 'test');
    },
    __instance: function() {
      return 'test'
    }
  };

  root.add({
    test: {
      '~': new Unit()
    }
  });

  root.init();
  const res = root.require('test');
  t.is(res, 'test');
});

test('adds a unit then adds another unit under the same namespace', t => {
  const root = new UnitSet();
  const Unit1 = function() {};
  Unit1.prototype = {
    __init: function(units) {
      t.is(units.require('test.test1'), this);
    }
  };

  const Unit2 = function() {};
  Unit2.prototype = {
    __init: function(units) {
      t.is(units.require('test.test2'), this);
    }
  };

  root.add('test', { 'test1': new Unit1() });
  root.add('test', { 'test2': new Unit2() });
  root.init();

  const res = root.require('test');
  t.true(res instanceof UnitSet);
  t.truthy(res._units);
  t.truthy(res._units.test1);
  t.truthy(res._units.test2);
});
