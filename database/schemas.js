var mongoose = require('mongoose'),
    validators = require('./validators');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

function stringToInt(v) {
  return parseInt(v, 10);
}

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

exports.User = User;
exports.Position = Position;
exports.Snapshot = Snapshot;
exports.Event = Event;