var models = require('../database').models,
    utils = require('./utils');

var authenticate = utils.authenticate,
    getOr404 = utils.getOr404;

exports.index = function(req, res, next) {
  res.render('index', {errors: []});
};

exports.user_page = function(req, res, next) {
  authenticate(next, req.session, function(user) {
    models.Event.find({$or: [{staffers: user._id}, {owner: user._id}]}, function(err, docs) {
      if(err) {
        res.render('user', {events: [], user: user});
      } else {
        var events = [];
        for(var i = 0; i < docs.length; i++) {
          var counter = 0,
              timestamp = 0;
          for(var j = 0; j < docs[i].snapshots.length; j++) {
            if(docs[i].snapshots[j].timestamp > timestamp) {
              timestamp = docs[i].snapshots[j].timestamp;
              counter = docs[i].snapshots[j].counter;
            }
          }
          events.push({
            id: docs[i]._id,
            title: docs[i].title,
            counter: counter,
            capacity: docs[i].capacity,
            owner: (String(docs[i].owner) == String(user._id))
          });
        }
        res.render('user', {events: events, user: user});
      }
    });
  });
};

exports.clicker = function(req, res, next) {
  authenticate(next, req.session, function(user) {
    console.log(models.Event, {$or: [{owner: user._id}, {staffers: user._id}], _id: req.param('id')});
    getOr404(next, models.Event, {$or: [{owner: user._id}, {staffers: user._id}], _id: req.param('id')}, 
      function(ev) {
        res.render('clicker', {layout: false});
      }
    );
  });
};

exports.positions = function(req, res, next) {
  authenticate(next, req.session, function(user) {
    getOr404(next, models.Event, {$or: [{owner: user._id}, {staffers: user._id}], _id: req.param('id')},
      function(ev) {
        res.json({error: null, data: ev.positions});
      }, function() {
        res.json({error: 'invalid event'});
      });
  }, function() {
    res.json({error: 'invalid user'});
  });
};