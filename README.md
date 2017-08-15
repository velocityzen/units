# Units

[![NPM Version](https://img.shields.io/npm/v/units.svg?style=flat-square)](https://www.npmjs.com/package/units)
[![NPM Downloads](https://img.shields.io/npm/dt/units.svg?style=flat-square)](https://www.npmjs.com/package/units)

Module-like system with two step initialization and definable namespaces for application modules.

## Example

```js
const units = new UnitSet();

const Controller = function () {
  this.db = undefined;
};

Controller.prototype.__init = function (units) {
  // all units are instantiated at this point
  // getting components we're depended on
  this.db = units.require('db');
};

units.add({
  controller: new Controller()
});

units.init(); // calls __init() function of every unit internally
```

## Unit

Unit is a simple interface

```js
const Controller = function () {
  this.db = undefined;
};

Controller.prototype.__init = function (units) {
  // all units are instantiated at this point
  // getting components we're depended on
  this.db = units.require('db');
};
```

### Interface methods

#### __init
Function, unit initialisation

#### __initRequired
Boolean, means that this unit, when required, will be returned inited

#### __instance
Function, If method present it will be called when a unit is required and it should return what you want to return instead of the unit class itself.

## UnitSet

`UnitSet` is a set of units. The root `UnitSet` that will contain all others you should create manually. All others will be created as in the example:

```js
// this is our root unit set
const units = new UnitSet();

units.add({
  resources: {
    user {
      api: new Api(),
      controller: new Controller()
    },
    post: {
      api: new Api(),
      controller: new Controller()
    }
  }
});
```

This will create unit sets `resources`, `user`, `post` with units `api` and `controller`. From `resources.post.api` you have access to all units:

```js
const Api = function() {
  this.ctrl = undefined;
}

Api.prototype.__init = function(units) {
  //require the post controller
  this.ctrl = units.require('controller');
  //require the user controller
  this.user = units.require('user.controller');
}

```

### Methods

#### add()

adds units or units sets

You can use it as aliases for `addAll` and `addSet` methods. However, there is one more possibility. You can add a plain object, not a Unit or UnitSet, and it will create UnitSet automatically. Examples:

```js
units.add('user', {
  api: new Api(),
  controller: new Controller()
})

//or

units.add('user', () => {
  return {
    api: new Api(),
    controller: new Controller()
  }
})
```

#### alias(key, dstKey)

Sets alias for key: dstKey will be obtained instead of key on get() and require() calls

#### expose(key, obj)

like `add(key, obj)`, but `__init` will not be called on this unit (so, a unit may omit `__init` implementation), used to expose constant or any object without `__init` method as a unit

#### extend(key, obj)

Like expose but if unit `key` exist just extends it with `obj`

### addInitRequired(key, unit)

like `add(key, obj)`, but will ensure that `__init` is called on that unit when it's being got by `get` or `require`, for units that are unusable unless inited

### addAll(obj)

adds all units sets from object with corresponding keys

### addSet(key, units)

makes units child UnitSet, adds all child units to itself under key specified
  * units have a unit with key '~', it will be added directly under key specified, instead of key+'.~'

### joinSet(units)

add all units of UnitSet specified to self, without any extra magic

### get(key)

gets unit under key specified, tries parent if no unit found and parent is present, takes into account aliases

### require(key)

calls `get` internally and returns a result if not null, otherwise, throws an error

### match(regexp, function)

calls the `function` for every unit name that matches `regexp`. The first argument in the function is always the matched unit. All others are matches from the regexp.

```js
  //example from matter-in-motion lib
  units
    .get('resources')
    .match('^(.*)\.api$', (unit, name) => console.log(name));
```

### forEach(function)

calls the 'function' for evry unit.

```js
  units.forEach((unit, name) => console.log(name));
```

### init()

calls `__init` method on all added units

## Iterable
```js
  for (let key of unitSet) {
    console.log(key); // will print all units keys from this unit set
  }
```


License MIT
