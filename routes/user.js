var hashlib = require('hashlib'),
    models = require('../database').models,
    utils = require('./utils');

var getOr404 = utils.getOr404;

exports.login = function(req, res, next) {
  var username = req.param('username'),
      password_hash = hashlib.md5(req.param('password'));
  getOr404(next, models.User, {username: username, password: password_hash}, function(user) {
    req.session.user_id = user._id;
    res.redirect('/user/');
  }, function() {
    res.render('index', {errors: ['Username/password does not match any account']});
  });
};

exports.logout = function(req, res) {
  if(req.session.user_id) {
    delete req.session.user_id;
  }
  res.redirect('/');
};

exports.register = function(req, res) {
  if(req.method == 'GET') {
    res.render('register', {errors: []});
  }
  else {
    if(req.param('register')) {
      var errors = [];
      req.onValidationError(function(msg) {
        errors.push(msg);
        return this;
      });
      
      req.check('username', 'You must enter a username').notEmpty();
      req.check('password', 'Your password must be at least 6 characters long').len(6);
      req.check('password', 'Your passwords don\'t match').equals(req.param('password-confirm'));
      
      req.sanitize('username').trim();
      
      models.User.find({username: req.param('username')}, function(err, docs) {
        if(err) {          console.log('Mongoose Error: '+err);
          res.render('register', {layout: true, errors: ['There was an error with the database.']});
        } else {
          if(docs.length > 0) {
            errors.push('Username already exists');
          }
          if(errors.length > 0) {
            // Show errors
            res.render('register', {layout: true, errors: errors});
          } else {
            // Create the new user
            var user = new models.User({
              username: req.param('username'),
              password: hashlib.md5(req.param('password'))
            });
            user.save(function(err) {
              if(err) {
                console.log('Mongoose Error: '+err);
                res.render('register', {layout: true, errors: ['There was an error creating your account']});
              } else {
                req.session.user_id = user._id;
                res.redirect('/user/');
              }
            });
          }
        }
      });
    } else {
      res.redirect('/register/');
    }
  }
};