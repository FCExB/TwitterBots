var moment = require('moment');

var text = '@RemindMeBot_ 07:20 tomorrow morning would be good please';

var words = text.split(' ');

for (var i = 0; i < words.length; i++) {
	var time = moment(words[i], ['HH:mm', 'H:mm'], true);
	console.log(words[i]);
        console.log(time.isValid());
}



