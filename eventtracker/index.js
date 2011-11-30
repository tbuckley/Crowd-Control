/*
initialize: {in_counter:, out_counter:, counter:, capacity:}
update_counter: {counter:}
update_position_counter: {in_counter:, out_counter:}
*/
var models = require('../database').models;

var SAVE_RATE = 10; // In seconds

var EventPosition = function() {
  function EventPosition(id, title, event, in_counter, out_counter) {
    this.id = id;
    this.title = title;
    this.event = event;
    this.staffers = {};
    this.num_staffers = 0;
    this.in_counter = in_counter ? in_counter : 0;
    this.out_counter = out_counter ? out_counter : 0;
  }
  EventPosition.prototype.isActive = function() {
    return this.num_staffers > 0;
  };
  EventPosition.prototype.addStaffer = function(staffer_id, name, socket) {
    staffer_id = this.num_staffers; // @TODO: Replace
    
    console.log('Adding staffer: ('+staffer_id+', '+name+') to ('+this.title+', '+this.id+')');
    this.staffers[staffer_id] = {
      id: staffer_id,
      name: name,
      socket: socket
    };
    this.num_staffers++;
    
    // Setup handlers
    var that = this;
    socket.on('increment', function(amount) {
      that.increment(staffer_id, amount);
    });
    socket.on('decrement', function(amount) {
      that.decrement(staffer_id, amount);
    });
    // pos.socket.on('disconnect', function() {
    //   that.deactivatePosition(position_id);
    // });
    
    // Let socket know it's ready
    socket.emit('initialize', {
      in_counter: this.in_counter,
      out_counter: this.out_counter,
      counter: this.event.counter,
      capacity: this.event.capacity
    });
  };
  EventPosition.prototype.removeStaffer = function(id) {
    delete this.staffers[id];
    this.num_staffers--;
  };
  EventPosition.prototype.increment = function(staffer_id, amount) {
    this.in_counter += amount;
    this.event.increment(amount);
    this.updatePositionCounter();
  };
  EventPosition.prototype.decrement = function(staffer_id, amount) {
    this.out_counter += amount;
    this.event.decrement(amount);
    this.updatePositionCounter();
  };
  EventPosition.prototype.updatePositionCounter = function() {
    this.sendData('update_position_counter', {
      in_counter: this.in_counter,
      out_counter: this.out_counter
    });
  };
  EventPosition.prototype.sendData = function(msg, data) {
    // @TODO: Consider making this a volatile message
    for(var id in this.staffers) {
      this.staffers[id].socket.emit(msg, data);
    }
  };
  return EventPosition;
}();


var EventTracker = function() {
  function EventTracker() {
    this.id = null;
    this.counter = 0;
    this.capacity = 0;
    this.positions = {};
    this.log = [];
    this.db_object = null;
  }
  EventTracker.events = {};
  EventTracker.getEvent = function(id, callback) {
    if(EventTracker.events[id] === undefined) {
      models.Event.findById(id, function(err, doc) {
        if (!err) {
          var e = new EventTracker();
          e.load(doc);
          e.register();
          //console.log('Event loaded: ('+e.title+', '+e.capacity+')');
          callback(e);
        } else {
          console.log(err);
          callback(null);
        }
      });
    } else {
      callback(EventTracker.events[id]);
    }
  };

  // Event Registration

  EventTracker.prototype.register = function() {
    EventTracker.events[this.id] = this;
    return this;
  };
  EventTracker.prototype.unregister = function() {
    delete EventTracker.events[this.id];
    this.stopSaving().save();
    return this;
  };

  // Position management

  EventTracker.prototype.signupStaffer = function(position_id, staffer_id, staffer_name, socket) {
    console.log(position_id);
    this.positions[position_id].addStaffer(staffer_id, staffer_name, socket);
    return this;
  };

  EventTracker.prototype.updateCounter = function() {
    for(var position_id in this.positions) {
      console.log("Updating counter for "+position_id);
      this.positions[position_id].sendData('update_counter', {
        counter: this.counter
      });
    }
    return this;
  };

  // Clicker management

  EventTracker.prototype.increment = function(amount) {
    this.counter += amount;
    this.updateCounter();
    return this;
  };
  EventTracker.prototype.decrement = function(amount) {
    this.counter -= amount;
    this.updateCounter();
    return this;
  };

  // Logging

  EventTracker.prototype.log = function(name, position, message) {
    return this;
  };
  
  // Loading
  
  EventTracker.prototype.load = function(db_object, callback) {
    var i, l;
    var position_maxtimestamp = {};
    for(i = 0, l = db_object.positions.length; i < l; i++) {
      var id = db_object.positions[i]._id,
          title = db_object.positions[i].title;
      this.positions[id] = new EventPosition(id, title, this);
      position_maxtimestamp[id] = 0;
    }
    for(i = 0, l = db_object.snapshots.length; i < l; i++) {
      var timestamp = db_object.snapshots[i].timestamp,
          position_id = db_object.snapshots[i].position;
      if(timestamp > position_maxtimestamp[position_id]) {
        this.positions[position_id].in_counter = db_object.snapshots[i].in_counter;
        this.positions[position_id].out_counter = db_object.snapshots[i].out_counter;
        position_maxtimestamp[position_id] = timestamp;
      }
    }
    var in_counter = 0, out_counter = 0;
    for(i in this.positions) {
      in_counter += this.positions[i].in_counter;
      out_counter += this.positions[i].out_counter;
    }
    this.title = db_object.title;
    this.capacity = db_object.capacity;
    this.counter = in_counter - out_counter;
    this.id = db_object._id;
    this.db_object = db_object;
    //this.startSaving();
    return this;
  };

  // Saving

  EventTracker.prototype.startSaving = function() {
    var that = this;
    this.save(function() {
      that.saveTimer = setTimeout(function() {that.startSaving();}, SAVE_RATE*1000);
    });
    return this;
  };
  EventTracker.prototype.stopSaving = function() {
    clearTimeout(this.saveTimer);
    return this;
  };
  EventTracker.prototype.save = function(complete) {
    for(var position_id in this.positions) {
      this.db_object.snapshots.push({
        position: position_id,
        in_counter: this.positions[position_id].in_counter,
        out_counter: this.positions[position_id].out_counter
      });
    }
    var that = this;
    this.db_object.save(function(err) {
      if(err) {console.log(err);}
      else {models.Event.find({_id: that.db_object._id}, function(err, result) {console.log("Saving:",result);});}
      if(complete) {complete();}
    });
    return this;
  };
  
  return EventTracker;
}();

models.Event.findOne({title: 'Heaven & Hell'}, function(err, doc) {
  if(err) {console.log(err);}
  else {exports.h_h = doc;}
});

exports.EventTracker = EventTracker;