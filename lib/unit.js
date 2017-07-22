'use strict';
// actually, it's an interface
const Unit = function() {};

Unit.prototype.__initRequired = false;

Unit.prototype.__init = function(units) {};

Unit.prototype.__instance = function(unitInfo) {
  return this;
};


module.exports = Unit;
