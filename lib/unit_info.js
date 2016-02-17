'use strict';
var UnitInfo = function(unit, originalUnitSet, isExposed, isInitRequired) {
  this.unit = unit;
  this.originalUnitSet = originalUnitSet;
  this.isExposed = isExposed;
  this.isInitRequired = !!isInitRequired;
  this.isInited = false;
};

UnitInfo.prototype.getPreparedUnit = function(forceInit) {
  let result = this.unit;
  if (!this.isExposed && this.unit) {
    if (!this.isInited && (forceInit || this.isInitRequired || this.unit.unitIsInitRequired)) {
      this.init();
    }
    if (this.unit.unitGetInstance) {
      result = this.unit.unitGetInstance(this);
    }
  }

  if (!result) {
    result = this.originalUnitSet;
  }

  return result;
};

UnitInfo.prototype.init = function() {
  if (!this.isInited && !this.isExposed) {
    if (this.unit) {
      this.unit.unitInit && this.unit.unitInit(this.originalUnitSet);
    } else {
      // this.originalUnitSet && this.originalUnitSet.init();
    }

    this.isInited = true; // avoiding double-init if unitInit() somehow calls init() again
  }
};


module.exports = UnitInfo;
