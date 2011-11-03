var express = require('express'),
    socketio = require('socket.io'),
    routes = require('./routes'),
    EventTracker = require('./eventtracker');

var app = express.createServer();
var io = socketio.listen(app);
module.exports = app;

var __dirname;

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view engine", "html");
  app.register(".html", require("jqtpl").express);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use("/static", express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);
app.post('/', routes.login);
app.get('/clicker', routes.clicker);

// Socket.IO


// Should use http://www.danielbaulig.de/socket-ioexpress/ to ensure socket is authorized
io.sockets.on('connection', function(socket) {
  console.log('Socket connected!');
  socket.on('register', function(data) {
    var eventId = data.eventId;
    var position = data.position;
    var name = data.name;
    EventTracker.EventTracker.getEvent(EventTracker.h_h._id, function(e) {
      if(e) {
        console.log('Event loaded');
        e.signupStaffer(EventTracker.h_h.positions[0]._id, 1, 'Tom', socket);
      } else {
        console.log('Error loading event.');
      }
    });
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
