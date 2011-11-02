exports.index = function(req, res) {
  res.render('index', {layout: false});
};

exports.login = function(req, res) {
  if(req.body.login) {
    res.redirect('/clicker/');
  }
};

exports.clicker = function(req, res) {
  res.render('clicker', {layout: false});
};