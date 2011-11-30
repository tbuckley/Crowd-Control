var mongoose = require('mongoose'),
    schemas = require('./schemas'),
    db = mongoose.connect('mongodb://localhost/crowdcontrol', function(err) {
      if (err) throw err;
    });

mongoose.connection.on('open', function() {
  console.info('Mongoose is connected.');
});

exports.db = db;
exports.models = {
  Position :  db.model('Position', schemas.Position),
  Snapshot :  db.model('Snapshot', schemas.Snapshot),
  Event :     db.model('Event', schemas.Event),
  User :      db.model('User', schemas.User)
};