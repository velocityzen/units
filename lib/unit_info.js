'use strict';
const UnitInfo = function(unit, unitSet, isExposed, isInitRequired) {
  this.unit = unit;
  this.unitSet = unitSet;
  this.isExposed = isExposed;
  this.isInitRequired = !!isInitRequired;
  this.isInited = false;
};

UnitInfo.prototype.get = function(forceInit) {
  if (!this.unit) {
    const unitSet = this.unitSet;
    return unitSet.units['~'] ? unitSet.units['~'].get(forceInit) : unitSet;
  }

  const unit = this.unit;
  if (!this.isExposed && unit) {
    if (!this.isInited && (forceInit || this.isInitRequired || unit.__initRequired)) {
      this.init();
    }
    if (unit.__instance) {
      return unit.__instance();
    }

    return unit;
  }

  return unit;
};

UnitInfo.prototype.init = function() {
  if (!this.isInited && !this.isExposed) {
    if (this.unit) {
      this.unit.__init && this.unit.__init(this.unitSet);
    } else {
      // this.unitSet && this.unitSet.init();
    }

    this.isInited = true; // avoiding double-init if __init() somehow calls init() again
  }
};


module.exports = UnitInfo;
