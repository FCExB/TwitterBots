var mongojs = require('./');
var db = mongojs('test', ['courses', 'a']);

db.a.find(function(err, as) {
  console.log(as);
});

db.on('error', function(err) {
  console.log('OH NOES!', err);
});
