/*
initialize: {in_counter:, out_counter:, counter:, capacity:}
update_counter: {counter:}
update_position_counter: {in_counter:, out_counter:}
*/
var models = require('../database').models;

var SAVE_RATE = 5; // In seconds

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
    socket.on('disconnect', function() {
      that.removeStaffer(staffer_id);
    });
    
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
    this.event.checkStaffers();
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
    this.title = "UNKNOWN EVENT";
    this.counter = 0;
    this.capacity = 0;
    this.positions = {};
    this.log = [];
    this.changed = false;
    this.db_object = null;
    this.saveTimer = null;
  }
  EventTracker.events = {};
  EventTracker.getEvent = function(id, callback) {
    if(EventTracker.events[id] === undefined) {
      models.Event.findById(id, function(err, doc) {
        if (!err) {
          var e = new EventTracker();
          e.load(doc);
          e.register();
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
    console.log('Registered event '+this.title);
    EventTracker.events[this.id] = this;
    return this;
  };
  EventTracker.prototype.unregister = function() {
    console.log('Unregistered event '+this.title);
    delete EventTracker.events[this.id];
    this.stopSaving().save();
    return this;
  };

  // Position management

  EventTracker.prototype.signupStaffer = function(position_id, staffer_id, staffer_name, socket) {
    if(this.positions[position_id]) {
      this.positions[position_id].addStaffer(staffer_id, staffer_name, socket);
    } else {
      socket.emit('error', 'no position');
    }
    return this;
  };
  
  EventTracker.prototype.checkStaffers = function() {
    var total_staffers = 0;
    for(var position_id in this.positions) {
      total_staffers += this.positions[position_id].num_staffers;
    }
    if(total_staffers === 0) {
      this.unregister();
    }
    return this;
  };

  EventTracker.prototype.updateCounter = function() {
    for(var position_id in this.positions) {
      this.positions[position_id].sendData('update_counter', {
        counter: this.counter
      });
    }
    return this;
  };
  
  EventTracker.prototype.updateSettings = function() {
    return this;
  };

  // Clicker management

  EventTracker.prototype.increment = function(amount) {
    this.counter += amount;
    this.changed = true;
    this.updateCounter();
    return this;
  };
  EventTracker.prototype.decrement = function(amount) {
    this.counter -= amount;
    this.changed = true;
    this.updateCounter();
    return this;
  };

  // Logging

  EventTracker.prototype.log = function(name, position, message) {
    return this;
  };
  
  // Loading
  
  EventTracker.prototype.load = function(db_object) {
    var i, l;
    for(i = 0, l = db_object.positions.length; i < l; i++) {
      var id = db_object.positions[i]._id,
          title = db_object.positions[i].title;
      this.positions[id] = new EventPosition(id, title, this);
    }
    var max_timestamp = 0,
        max_snapshot = null;
    for(i = 0, l = db_object.snapshots.length; i < l; i++) {
      var timestamp = db_object.snapshots[i].timestamp;
      if(timestamp > max_timestamp) {
        // this.positions[position_id].in_counter = db_object.snapshots[i].in_counter;
        // this.positions[position_id].out_counter = db_object.snapshots[i].out_counter;
        max_snapshot = db_object.snapshots[i];
        max_timestamp = timestamp;
      }
    }
    if(max_snapshot) {
      for(i = 0; i < max_snapshot.positions.length; i++) {
        var p = max_snapshot.positions[i];
        this.positions[p.position].in_counter = p.in_counter;
        this.positions[p.position].out_counter = p.out_counter;
      }
    }
    this.title = db_object.title;
    this.capacity = db_object.capacity;
    this.counter = max_snapshot ? max_snapshot.counter : 0;
    this.id = db_object._id;
    this.db_object = db_object;
    this.changed = false;
    this.startSaving();
    return this;
  };

  // Saving

  EventTracker.prototype.startSaving = function() {
    var that = this;
    if(this.changed) {
      this.save(function() {
        that.saveTimer = setTimeout(function() {that.startSaving();}, SAVE_RATE*1000);
      });
    } else {
      that.saveTimer = setTimeout(function() {that.startSaving();}, SAVE_RATE*1000);
    }
    return this;
  };
  EventTracker.prototype.stopSaving = function() {
    if(this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    return this;
  };
  EventTracker.prototype.save = function(complete) {
    var snapshot = {
      positions: [],
      counter: this.counter
    };
    for(var position_id in this.positions) {
      snapshot.positions.push({
        position: position_id,
        in_counter: this.positions[position_id].in_counter,
        out_counter: this.positions[position_id].out_counter
      });
    }
    this.db_object.snapshots.push(snapshot);
    var that = this;
    this.db_object.save(function(err) {
      if(err) {console.log(err);}
      else {
        models.Event.find({_id: that.db_object._id}, function(err, result) {
          console.log("Saving "+that.title, snapshot);
        });
        that.changed = false;
      }
      if(complete) {complete();}
    });
    return this;
  };
  
  return EventTracker;
}();

exports.EventTracker = EventTracker;
exports.SAVE_RATE = SAVE_RATE;