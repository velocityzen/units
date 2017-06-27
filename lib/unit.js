'use strict';
// actually, it's an interface
const Unit = function() {};

Unit.prototype.unitIsInitRequired = false;

Unit.prototype.unitInit = function(units) {
};

Unit.prototype.unitGetInstance = function(unitInfo) {
  return this;
};


module.exports = Unit;
