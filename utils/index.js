exports.map = function(items, f) {
  var data = [];
  for(var i = 0; i < items.length; i++) {
    data.push(f(items[i], i));
  }
  return data;
};
exports.filter = function(items, p) {
  var data = [];
  for(var i = 0; i < items.length; i++) {
    if(p(items[i], i)) {
      data.push(items[i]);
    }
  }
  return data;
};
exports.asyncMap = function(items, f, callback) {
  var data = [];
  var num_processed = 0;
  var num_items = items.length;
  if(num_items === 0) {
    callback([]);
  } else {
    for(var i = 0; i < items.length; i++) {
      f(items[i], function(i) {
        return function(result) {
          data[i] = result;
          num_processed++;
          if(num_processed == num_items) {
            callback(data);
          }
        };
      }(i));
    }
  }
};