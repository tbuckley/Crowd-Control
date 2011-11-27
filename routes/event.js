var routeUtils = require('./utils'),
    utils = require('../utils'),
    models = require('../database').models,
    NotAuthorized = require('./error').NotAuthorized,
    sanitize = require('validator').sanitize;

var map = utils.map,
    filter = utils.filter,
    asyncMap = utils.asyncMap;

var authenticate = routeUtils.authenticate,
    getOr404 = routeUtils.getOr404,
    deleteItem = routeUtils.deleteItem;

function asyncUsernameForId(id, callback) {
  models.User.findById(id, function(err, doc) {
    if(err) {
      callback(null);
    } else if(doc === null) {
      callback(null);
    } else {
      callback(doc.username);
    }
  });
}
function asyncIdForUsername(username, callback) {
  models.User.findOne({username: username}, function(err, doc) {
    if(err) {
      callback(null);
    } else if(doc === null) {
      callback(null);
    } else {
      callback(doc._id);
    }
  });
}

function createEvent(req, user, callback) {
  var errors = [];
  req.onValidationError(function(msg) {
    errors.push(msg);
    return this;
  });
  
  req.assert('event-title', 'You must enter a title').notEmpty();
  req.assert('capacity', 'Capacity must be a number').isInt();
  req.assert('backup-email', 'Backup email is invalid').isEmail();
  req.assert('backup-rate', 'Rate must be a number').isInt();
  req.assert('positions', 'You must list at least one position').notEmpty();
  
  req.sanitize('event-title').trim();
  req.sanitize('capacity').toInt();
  req.sanitize('backup-email').trim();
  req.sanitize('backup-rate').toInt();
  
  var positions = map(req.param('positions').split('\n'), function(p) {return sanitize(p).trim();});
  positions = filter(positions, function(p) {return p !== '';});
  positions = map(positions, function(p) {
    return new models.Position({title: p});
  });
  
  var staffers = map(req.param('staffers').split('\n'), function(s) {return sanitize(s).trim();});
  staffers = filter(staffers, function(v) {return v !== '';});
  asyncMap(staffers, asyncIdForUsername, function(staffer_ids) {
    var invalid_ids = filter(map(staffer_ids, function(id, i) {return {id: id, i: i};}), 
      function(v) {return v.id === null;});
    var invalid_staffers = map(invalid_ids, function(v) {return staffers[v.i];});
    if(invalid_staffers.length > 0) {
      errors.push('Invalid staffers: ' + invalid_staffers.join(', '));
    }
    
    if(errors.length > 0) {
      callback(null, errors, {
        title: req.param('event-title'),
        capacity: req.param('capacity'),
        email: req.param('backup-email'),
        frequency: req.param('backup-rate'),
        staffers: req.param('staffers'),
        positions: req.param('positions')
      });
    } else {
      var ev = new models.Event({
        owner: user._id,
        title: req.param('event-title'),
        capacity: req.param('capacity'),
        positions: positions,
        staffers: staffer_ids,
        backup_email: req.param('backup-email'),
        backup_rate: req.param('backup-rate')
      });
      callback(ev, [], {});
    }
  });
}

exports.event_add = function(req, res, next) {
  authenticate(next, req.session, function(user) {
    if(req.method == 'GET') {
      res.render('edit_event', {action: req.url, submit: 'Create Event', errors: [], user: user});
    }
    else {
      if(req.param('submit')) {
        createEvent(req, user, function(ev, errors, defaults) {
          if(errors.length > 0) {
            res.render('edit_event', {action: req.url, submit: 'Create Event', errors: errors, user: user, defaults: defaults});
          } else {
            ev.save(function(err) {
              if(err) {
                console.log(err);
                res.render('edit_event', {action: req.url, submit: 'Create Event', errors: ['There was a problem saving your event'], user: user});
              } else {
                res.redirect('/user');
              }
            });
          }
        });
      } else {
        res.redirect('/event/add');
      }
    }
  });
};

exports.event_edit = function(req, res, next) {
  authenticate(next, req.session, function(user) {
    getOr404(next, models.Event, {_id: req.params.id, owner: user._id}, function(doc) {
      if(req.method == 'GET') {
        asyncMap(doc.staffers, asyncUsernameForId, function(staffers) {
          var position_titles = map(doc.positions, function(v) {return v.title;});
          res.render('edit_event', {action: req.url, submit: 'Save Event', errors: [], user: user, defaults: {
            title: doc.title,
            capacity: doc.capacity,
            email: doc.backup_email,
            frequency: doc.backup_rate,
            staffers: staffers.join('\n'),
            positions: position_titles.join('\n')
          }});
        });
      } else {
        if(req.param('submit')) {
          createEvent(req, user, function(ev, errors, defaults) {
            if(errors.length > 0) {
              res.render('edit_event', {action: req.url, submit: 'Save Event', errors: errors, user: user, defaults: defaults});
            } else {
              doc.title = ev.title;
              doc.capacity = ev.capacity;
              doc.positions = ev.positions;
              doc.staffers = ev.staffers;
              doc.backup_email = ev.backup_email;
              doc.backup_rate = ev.backup_rate;
              doc.save(function(err) {
                if(err) {
                  console.log(err);
                  res.render('edit_event', {action: req.url, submit: 'Save Event', errors: ['There was a problem saving your event'], user: user});
                } else {
                  res.redirect('/user');
                }
              });
            }
          });
        } else {
          asyncMap(doc.staffers, asyncUsernameForId, function(staffers) {
            var position_titles = map(doc.positions, function(v) {return v.title;});
            res.render('edit_event', {action: req.url, submit: 'Save Event', errors: [], user: user, defaults: {
              title: doc.title,
              capacity: doc.capacity,
              email: doc.backup_email,
              frequency: doc.backup_rate,
              staffers: staffers.join('\n'),
              positions: position_titles.join('\n')
            }});
          });
        }
      }
    });
  });
};

exports.event_delete = function(req, res, next) {
  authenticate(next, req.session, function(user) {
    getOr404(next, models.Event, {_id: req.params.id, owner: user._id}, function(doc) {
      deleteItem(req, res, doc, 'event', doc.title, '/user', '/user');
    });
  });
};