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
      var events = [];
      for(var i = 0; i < docs.length; i++) {
        events.push({
          id: docs[i]._id,
          title: docs[i].title,
          counter: 0,
          capacity: docs[i].capacity,
          owner: (String(docs[i].owner) == String(user._id))
        });
      }
      res.render('user', {events: events, user: user});
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