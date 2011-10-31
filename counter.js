var app = require('http').createServer(handler),
    fs = require('fs'),
    path = require('path'),
    io = require('socket.io').listen(app);

app.listen(8080);

function handler(req, res) {
  fs.readFile(path.join('./', req.url), function(err, data) {
    if(err) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Error!');
    } else {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    }
  });
}



var counter = 0;
io.sockets.on('connection', function(socket) {
  socket.on('increment', function() {
    counter += 1;
    io.sockets.emit('update', counter);
  });
  socket.on('decrement', function() {
    counter -= 1;
    io.sockets.emit('update', counter);
  });
});