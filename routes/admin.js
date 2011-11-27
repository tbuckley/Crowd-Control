var models = require('../database').models;

// @TODO: REMOVE (or make admin-only)
exports.delete_users = function(req, res) {
  models.User.remove({}, function(err) {
    if(err) {
      res.end('Error: '+err);
    } else {
      res.end('All users were successfully deleted');
    }
  });
};

exports.delete_events = function(req, res) {
  models.Event.remove({}, function(err) {
    if(err) {
      res.end('Error: '+err);
    } else {
      res.end('All events were successfully deleted');
    }
  });
};