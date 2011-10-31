$(document).ready(function() {
  var socket = io.connect('http://localhost:8080');
  $('#incr_button').click(function() {
    socket.emit('increment');
    return false;
  });
  $('#decr_button').click(function() {
    socket.emit('decrement');
    return false;
  });
  
  socket.on('update', function(count) {
    $('#number').text(count);
  });
});
