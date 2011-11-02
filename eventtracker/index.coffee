class Position
  constructor: (@position) ->
    @staffers = []
    @in_counter = 0
    @out_counter = 0
  
  isActive: -> (@names.length > 0)
  
  addStaffer: (name, socket) ->
    @staffers.append({
      name: name,
      socket: socket
    })
  removeStaffer: (name) ->
    staffer = -1
    for i in [0...@staffers.length]
      if @staffers[i].name == name then staffer = i
    @staffers.splice(i,1)

class EventTracker
  constructor: (@id) ->
    @counter = 0
    @capacity = 100
    @positions = {}
    @log = []
    @load()
  
  add: -> EventTracker.events[@id] = this
  remove: -> 
    delete EventTracker.events[@id]
    @stopSaving()
    @save()
  
  getPosition: (position) ->
    @position[position]
  signupStaffer: (position, name, socket) ->
    pos = @getPosition(position)
    pos.addStaffer(name, socket)
    socket.on('increment', (amount) -> @increment(position, amount))
    socket.on('decrement', (amount) -> @decrement(position, amount))
    socket.on('disconnect', ->
      socket.removeAllListeners('increment')
      socket.removeAllListeners('decrement')
      )
    socket.emit('activate', {
      counter: @counter,
      capacity: @capacity,
      in_counter: pos.in_counter,
      out_counter: pos.out_counter
    })

exports.EventTracker = EventTracker