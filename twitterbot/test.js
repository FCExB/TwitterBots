var moment = require('moment');

var time = moment('07:20', ['HH:mm', 'H:mm'], true);

console.log(time);
console.log(time.isValid());
