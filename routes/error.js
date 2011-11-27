function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}
function NotAuthorized(msg){
  this.name = 'NotAuthorized';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}
NotFound.prototype.__proto__ = Error.prototype;
NotAuthorized.prototype.__proto__ = Error.prototype;

exports.NotFound = NotFound;
exports.NotAuthorized = NotAuthorized;
exports.error = function(err, req, res, next){
  if (err instanceof NotAuthorized) {
    res.render('403');
  } else if (err instanceof NotFound) {
    // @TODO: make 404 page
    res.render('403');
  } else {
    next(err);
  }
};