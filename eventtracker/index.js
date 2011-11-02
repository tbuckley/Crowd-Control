/*
activate: {in_counter:, out_counter:, counter:, capacity:}
deactivate: {position:, name:}
update: {counter:}
*/

function EventTracker(id) {
  this.id = id;
  this.counter = 0;
  this.capacity = 100;
  this.positions = {};
  this.log = [];
  this.load();
}
EventTracker.events = {};
EventTracker.getEvent = function(id) {
  if(!EventTracker.events[id]) {
    var e = new EventTracker(id);
    EventTracker.events[id] = e;
    console.log('['+id+'] Loaded');
    e.add();
  }
  return EventTracker.events[id];
};

EventTracker.prototype.add = function() {
  EventTracker.events[this.id] = this;
};
EventTracker.prototype.remove = function() {
  delete EventTracker.events[this.id];
  this.stopSaving();
  this.save();
};

// Position management

EventTracker.prototype.activatePosition = function(position, name, socket) {
  var that = this;
  var pos = this.positions[position] ? this.positions[position] : this.addPosition(position);
  var old_socket = pos.socket;
  pos.name = name;
  pos.active = true;
  pos.socket = socket;
  
  // If necessary, alert previous position staffer of replacement
  if(old_socket) {
    old_socket.emit('deactivate', {
      position: position,
      name: name
    });
    // @TODO Deactivate old socket's listeners
  }
  
  // Initialize new socket
  pos.socket.on('disconnect', function() {
    that.deactivatePosition(position);
  });
  pos.socket.on('increment', function(amount) {
    that.increment(position, amount);
  });
  pos.socket.on('decrement', function(amount) {
    that.decrement(position, amount);
  });
  
  // Let socket know it's ready
  pos.socket.emit('activate', {
    in_counter: pos.in_counter,
    out_counter: pos.out_counter,
    counter: this.counter,
    capacity: this.capacity
  });
  console.log('['+position+'] Activate Position ('+position+', '+name+')');
};
EventTracker.prototype.deactivatePosition = function(position) {
  this.positions[position].name = '-Unstaffed-';
  this.positions[position].active = false;
  this.positions[position].socket = null;

/*  for(var pos in this.positions) {
    if(this.positions[pos].active) {
      return;
    }
  }
  this.remove();*/
};
EventTracker.prototype.update = function() {
  for(var position in this.positions) {
    var pos = this.positions[position];
    if(pos.active && pos.socket) {
      pos.socket.emit('update', {
        counter: this.counter
      });
    }
  }
};

// Clicker management

EventTracker.prototype.increment = function(position, amount) {
  this.counter += amount;
  this.positions[position].in_counter += amount;
  this.positions[position].in_delta += amount;
  this.update();
};
EventTracker.prototype.decrement = function(position, amount) {
  this.counter -= amount;
  this.positions[position].out_counter += amount;
  this.positions[position].out_delta += amount;
  this.update();
};

// Logging

EventTracker.prototype.log = function(name, position, message) {
  
};

// Saving

EventTracker.prototype.startSaving = function() {
  var that = this;
  this.save(function() {
    that.saveTimer = setTimeout(this.startSaving, 60*1000);
  });
};
EventTracker.prototype.stopSaving = function() {
  clearTimeout(this.saveTimer);
};
EventTracker.prototype.save = function(complete) {
  for(var position in this.positions) {
    var position_data = this.positions[position];
    // Save data with timestamp
  }
  if(complete) {
    complete();
  }
};

// Loading

EventTracker.prototype.load = function() {
  // Load event from the database
};
EventTracker.prototype.addPosition = function(position) {
  this.positions[position] = {
    name: '-Unstaffed-',
    active: false,
    in_counter: 0,
    out_counter: 0,
    in_delta: 0,
    out_delta: 0
  };
  return this.positions[position];
};

exports.EventTracker = EventTracker;