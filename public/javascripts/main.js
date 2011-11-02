var io;
var socket;
$(document).ready(function() {
  socket = io.connect('http://localhost:3000');

  var in_counter = 0, out_counter = 0, capacity = 0;
  var in_delta = 0, out_delta = 0;
  var action_timer = null;
  
  $('#undo-bar').hide();
  
  function undo_handler() {
    socket.emit('increment', -in_delta);
    socket.emit('decrement', -out_delta);
    in_counter -= in_delta;
    out_counter -= out_delta;
    $('#in-counter').text(in_counter.toString());
    $('#out-counter').text(out_counter.toString());
    in_delta = 0;
    out_delta = 0;
    clearTimeout(action_timer);
    action_timer = null;
    $('#undo-bar').slideUp();
    return false;
  }
  function performed_action() {
    $('#undo-bar .message').text('In: '+in_delta+', Out: '+out_delta);
    if(action_timer) {
      clearTimeout(action_timer);
    } else {
      $('#undo-bar').slideDown();
    }
    action_timer = setTimeout(function() {
      $('#undo-bar').slideUp();
      in_delta = out_delta = 0;
      action_timer = null;
    }, 10*1000);
  }
  
  function in_handler(amt) {
    return function() {
      socket.emit('increment', amt);
      in_counter += amt;
      in_delta += amt;
      $('#in-counter').text(in_counter + '');
      performed_action();
      return false;
    };
  }
  function out_handler(amt) {
    return function() {
      socket.emit('decrement', amt);
      out_counter += amt;
      out_delta += amt;
      $('#out-counter').text(out_counter + '');
      performed_action();
      return false;
    };
  }
  
  $('#incr_button').bind('mouseup', in_handler(1));
  $('#incr2_button').bind('mouseup', in_handler(2));
  $('#incr4_button').bind('mouseup', in_handler(4));
  $('#decr_button').bind('mouseup', out_handler(1));
  $('#decr2_button').bind('mouseup', out_handler(2));
  $('#decr4_button').bind('mouseup', out_handler(4));
  
  $('.button').bind('mousedown', function() {
    $(this).addClass('depressed');
  }).bind('mouseup', function() {
    $(this).removeClass('depressed');
  });
  
  $('#undo-button').bind('click', undo_handler);
  
  var updateHandler, activateHandler, deactivateHandler, updateCapacityIndicator;
  
  updateCapacityIndicator = function(counter) {
    if(counter >= capacity) {
      if(!$('.major-counter').hasClass('over')) {$('.major-counter').addClass('over');}
      $('.major-counter').removeClass('close');
    } else if(counter >= capacity * 0.85) {
      if(!$('.major-counter').hasClass('close')) {$('.major-counter').addClass('close');}
      $('.major-counter').removeClass('over');
    }
    else {
      $('.major-counter').removeClass('close').removeClass('over');
    }
  };
  updateHandler = function(data) {
    $('#total-counter').text(data.counter);
    updateCapacityIndicator(data.counter);
  };
  activateHandler = function(data) {
    socket.removeAllListeners('activate');
    $('#total-counter').text(data.counter);
    $('#in-counter').text(in_counter = data.in_counter);
    $('#out-counter').text(out_counter = data.out_counter);
    capacity = data.capacity;
    $('.major-counter .suffix').text('Capacity: '+capacity);
    updateCapacityIndicator(data.counter);
    socket.on('update', updateHandler);
    socket.on('deactivate', deactivateHandler);
  };
  deactivateHandler = function(data) {
    socket.removeAllListeners('deactivate');
    socket.removeAllListeners('update');
    socket.on('activate', activateHandler);
  };
  
  $('.carousel-active').css('left', $('.carousel-buttons .buttons').offset().left - 5);
  $('.carousel-active').css('width', $('.carousel-buttons .buttons').width() + 10);
  $('.carousel-buttons .phone').bind('click', function() {
    $('.carousel-active').animate({
      left: $('.carousel-buttons .phone').offset().left - 5,
      width: $('.carousel-buttons .phone').width() + 10
    }, 800);
    $('.carousel .content').animate({
      left: $('.carousel .content').offset().left - $('#phone-numbers').offset().left
    }, 800);
    return false;
  });
  $('.carousel-buttons .buttons').bind('click', function() {
    $('.carousel-active').animate({
      left: $('.carousel-buttons .buttons').offset().left - 5,
      width: $('.carousel-buttons .buttons').width() + 10
    }, 800);
    $('.carousel .content').animate({
      left: $('.carousel .content').offset().left - $('#buttons').offset().left
    }, 800);
    return false;
  });
  $('.carousel-buttons .overview').bind('click', function() {
    $('.carousel-active').animate({
      left: $('.carousel-buttons .overview').offset().left - 5,
      width: $('.carousel-buttons .overview').width() + 10
    }, 800);
    return false;
  });
  
  socket.on('activate', activateHandler);
  socket.emit('register', {
    eventId: 'Heaven & Hell', 
    position: 'Bingham',
    name: 'Tom'
  });
});