var error = require('./error'),
    models = require('../database').models;

var NotAuthorized = error.NotAuthorized,
    NotFound = error.NotFound;

function getOr404(next, model, attributes, foundCallback, missingCallback) {
  missingCallback = missingCallback || function() {
    next(new NotFound());
  };
  model.findOne(attributes, function(err, doc) {
    if(err || !doc) {
      missingCallback();
    } else {
      foundCallback(doc);
    }
  });
}
function authenticate(next, session, authenticatedCallback, unauthenticatedCallback) {
  unauthenticatedCallback = unauthenticatedCallback || function() {
    next(new NotAuthorized());
  };
  if(session.user_id) {
    getOr404(next, models.User, {_id: session.user_id}, authenticatedCallback, unauthenticatedCallback);
  } else {
    unauthenticatedCallback();
  }
}

function deleteItem(req, res, item, type, title, cancel, redirect) {
  if(req.body && req.body['delete']) {
    item.remove();
    res.redirect(redirect);
  } else {
    res.render('delete', {type: type, title: title, cancel: cancel});
  }
}

exports.getOr404 = getOr404;
exports.authenticate = authenticate;

exports.deleteItem = deleteItem;