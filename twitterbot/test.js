var moment = require('moment');

var text = process.argv[2];


var time = moment(text, ['hh:mma', 'hh:mm a', 'h:mma', 'h:mm a', 'h.mma', 'ha', 'HH:mm', 'HHmm', 'H:mm', 'HH.mm', 'H.mm', ]);

console.log(text);
console.log(time.isValid());
console.log(time.format('hh:mma'));
console.log();
console.log(time);
