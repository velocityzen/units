# Units

[![NPM Version](https://img.shields.io/npm/v/units.svg?style=flat-square)](https://www.npmjs.com/package/units)
[![NPM Downloads](https://img.shields.io/npm/dt/units.svg?style=flat-square)](https://www.npmjs.com/package/units)

Simple, module-like dependency injection system with two-step initialization and definable namespaces for application modules, plugins, and extensions.

## Example

```js
const Units = require('units');
const units = new Units();

class Controller {
  constructor() {
    this.db = undefined;
  }

  init({ db }) {
    // getting components we're depended on
    this.db = db;
  }
}

units.add({
  controller: new Controller()
})

units.init(); // calls init() function of every unit internally
```

## Unit

Unit is a simple interface

```js
class Controller {
  constructor() {
    this.db = undefined;
  }

  init({ 'db.mysql': db }) {
    this.db = db;
  }
}
```

### Interface methods and properties

#### init()

Initialize all the units.

#### initRequired = true

The unit with this property will be initialized when required.

#### instance / instance()

The property or function, If present it will be called when a unit is required and returned instead of unit class itself.

## Units

`Units` is a single class that manages all the structure. The root `Units` contains all the units. Child units can be added as in this example:

```js
// this is our root unit set
const units = new Units({
  resources: {
    user: {
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

This will create units `resources` as a container, `user`, `post` with units `api` and `controller`. From `resources.post.api` you have access to all units:

```js
class Api {
  init({ controller, 'user.controller': user }) {
    this.ctrl = controller;
    this.user = user;
  }
}
```

## Methods

### constructor(units)

If `units` present passes it to `add` method.

#### add()

Adds units or units sets. You can add a plain object, not Units, and it will create Units automatically. Examples:

```js
units.add({ user: {
  api: new Api(),
  controller: new Controller()
}})

//or

units.add({ user: () => ({
  api: new Api(),
  controller: new Controller()
})})
```

#### expose(obj)

like `add(obj)`, but `init` will not be called on this unit (so, a unit may omit `init` implementation), used to expose constant or any object without `init` method as a unit. If you want to expose an object when you use the `add` method you can add the `@expose` property to the object you want to expose. Example:

```js
const units = new Units({
  constants: {
    '@expose': true,
    a: 'a',
    b: 'b'
  }
})
```

#### extend(obj)

Like expose but if unit exist just extends it with `obj`. If you want to extend an object when you use `add` method you can add `@extend` property to the object you want to expose. Example:

```js
const units = new Units({
  constants: {
    '@expose': true,
    a: 'a',
    b: 'b'
  }
});

units.add({
  constants: {
    '@extend': true,
    c: 'c'
  }
})
```

### join(units)

Adds all the units from `units` to self, without any extra magic

### alias(aliasKey, srcKey)

Sets the alias `aliasKey` for unit `srcKey`

### has(key)

Returns `true` if units exist under the `key`. Otherwise returns `false`.

### get(key)

Gets unit under `key` specified, tries parent if no unit found and parent is present. If `key` omitted and units instance has representation returns it.

### require(key)

Calls `get` internally and returns a result if not null, otherwise, throws an error

### match(regexp, function)

Calls the `function` for every unit name that matches `regexp`. The first argument in the function is always the matched unit. All others are matches from the regexp.

```js
  //example from matter-in-motion lib
  units
    .get('resources')
    .match('^(.*)\.api$', (unit, name) => console.log(name));
```

### forEach(function)

Calls the 'function' for every unit.

```js
  units.forEach((unit, name) => console.log(name));
```

### init()

Calls `init` method on all added units

## Iterable

```js
  for (let key of units) {
    console.log(key); // will print all units keys from this unit set
  }
```

License MIT
