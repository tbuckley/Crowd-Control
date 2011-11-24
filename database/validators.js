exports.validIds = function(v) {
  for(var i = 0; i < v.length; i++) {
    if(v === null) {return false;}
  }
  return true;
};

exports.stringLengthValidator = function(n) {
  return function(v) {
    return (v.length > n);
  };
};

exports.isInteger = function(v) {
  return (!isNaN(v)) && (Math.floor(v) == v);
};

exports.arrayLengthValidator = function(n) {
  return function(v) {
    return (v.length > n);
  };
};