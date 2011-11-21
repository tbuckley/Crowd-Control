var mongoose = require('mongoose'),
    db = mongoose.connect('mongodb://localhost/crowdcontrol', function(err) {
      if (err) throw err;
    });

mongoose.connection.on('open', function() {
  console.log('Mongoose is connected.');
});

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var User = new Schema({
  username    : String,
  password    : String,
  name        : String,
  admin       : Boolean
});

var Position = new Schema({
  title       : String
});
var Snapshot = new Schema({
  timestamp   : { type: Date, 'default': Date.now },
  position    : ObjectId,
  in_counter  : Number,
  out_counter : Number
});
var Event = new Schema({
  title         : String,
  capacity      : Number,
  positions     : [Position],
  snapshots     : [Snapshot],
  owner         : ObjectId,
  staffers      : [ObjectId],
  backup_email  : String,
  backup_rate   : Number
});

exports.db = db;
exports.models = {
  Position :  db.model('Position', Position),
  Snapshot :  db.model('Snapshot', Snapshot),
  Event :     db.model('Event', Event),
  User :      db.model('User', User)
};