var express = require('express'),
    expressValidator = require('express-validator'),
    socketio = require('socket.io'),
    MemoryStore = express.session.MemoryStore,
    routes = require('./routes'),
    EventTracker = require('./eventtracker'),
    connect = require('connect'),
    parseCookie = connect.utils.parseCookie,
    Session = connect.middleware.session.Session,
    sessionStore = new MemoryStore(),
    models = require('./database').models;

var app = express.createServer();
module.exports = app;

var __dirname;

// Configuration

connect.session.ignore.push('/stylesheets/style.css');
connect.session.ignore.push('/javascripts/main.js');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set("view engine", "html");
  app.register(".html", require("jqtpl").express);
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(expressValidator);
  app.use(express.methodOverride());
  app.use(express.cookieParser('secret'));
  app.use(express.session({store: sessionStore, secret: 'secret', key: 'express.sid', cookie: {maxAge: 300000}}));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

// Main
app.get('/', routes.main.index);
app.get('/user', routes.main.user_page);
app.get('/event/:id/clicker', routes.main.clicker);
app.get('/event/:id/positions', routes.main.positions);

//User
app.post('/', routes.user.login);
app.get('/logout', routes.user.logout);
app.all('/register', routes.user.register);

// Admin
app.get('/deleteusers', routes.admin.delete_users);
app.get('/deleteevents', routes.admin.delete_events);

// Event
app.all('/event/add', routes.event.event_add);
app.all('/event/:id/edit', routes.event.event_edit);
app.all('/event/:id/delete', routes.event.event_delete);

app.error(routes.error.error);


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


// Socket.IO
// Should use http://www.danielbaulig.de/socket-ioexpress/ to ensure socket is authorized

var io = socketio.listen(app);

io.set('authorization', function(data, accept) {
  if(data.headers.cookie) {
    data.cookie = parseCookie(data.headers.cookie);
    data.sessionID = data.cookie['express.sid'];
    data.sessionStore = sessionStore;
    sessionStore.get(data.sessionID, function(err, session) {
      if(err || !session) {
        accept(err, false);
      } else {
        data.session = new Session(data, session);
        accept(null, true);
      }
    });
  } else{
    accept('No cookie', false);
  }
});
io.sockets.on('connection', function(socket) {
  var hs = socket.handshake;
  
  var intervalID = setInterval(function () {
    hs.session.reload(function () { 
        hs.session.touch().save();
    });
  }, 60 * 1000);
  socket.on('disconnect', function () {
    console.log('A socket with sessionID ' + hs.sessionID 
      + ' disconnected!');
    clearInterval(intervalID);
  });
  
  socket.on('register', function(data) {
    models.User.findById(hs.session.user_id, function(err, user) {
      EventTracker.EventTracker.getEvent(data.event_id, function(e) {
        if(e) {
          e.signupStaffer(data.position_id, 1, user.username, socket);
        } else {
          console.log('Error loading event.');
        }
      });
    });
  });
});
