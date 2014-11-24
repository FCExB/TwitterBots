var http = require("http"),
    mongojs = require("mongojs"); 

var moment = require('moment');

var uri = 'localhost:27017/RemindMe';
var db = mongojs.connect(uri, ["tweets"]);

var server = http.createServer(function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});

        var html = '<h1>Tweets!</h2>';
        
        db.tweets.find().sort({reminder_time: 1}).forEach(function(err, tweet) {
	    if(err) {
                console.log("There was an error executing the database query.");
                response.end();
                return;
            }
            
            if (!tweet) {
                response.write(html);
                response.end();
                return;
            }
           
            var user = tweet.user.screen_name;

            html += '<p>';
               
            var timeToReminder = new Date(tweet.reminder_time - Date.now());
            html += timeToReminder.getHours() + ':' + timeToReminder.getMinutes() + ':' + timeToReminder.getSeconds();

            html += ' <b>@' + user + ':</b> ' + tweet.text; 
               

            html += ' <a href=\"http://twitter.com/' + user + '/status/' + tweet.id_str + '\"> Tweet </a>'; 

            html += ' <b>UTC Offset:</b> ' + tweet.user.utc_offset;

            html += '</p>';   
            
            console.log(tweet);
            console.log();
        });
});

server.listen(3000);

var Twit = require('twit')

var T = new Twit({
    consumer_key:         'FOHJfcWiJE2tFBGrZtqMM4wIh'
  , consumer_secret:      'n9NZQhYKzKJp431hIdlorNKLYWKVgNIElBIaE4sQ71pbyBa82K'
  , access_token:         '2885734899-Ib3OdFxDaCSW3o31FoVuQpDcc2B6LisYAzF9LVK'
  , access_token_secret:  'RSXkSuF0NbvVIhTcCD64YnE0TvWCJbcfSuTYiD7FOutYP'
})


var stream = T.stream('statuses/filter', { track: 'someone remind me tomorrow' })

stream.on('tweet', function (tweet) {
    console.log('@' + tweet.user.screen_name + ': ' + tweet.text);
    
    if (tweet.user.screen_name == 'RemindMe__' || tweet.text.slice(0, 2) == 'RT') {
      return;
    }

    var reminderTime = new Date(tweet.created_at);

    reminderTime.setTime(reminderTime.getTime() + 24 * 60 * 60 * 1000);
    reminderTime.setHours(9);
    reminderTime.setMinutes(30); 

    tweet.reminder_time = reminderTime.getTime() + parseInt(tweet.user.utc_offset) * 1000;

    db.tweets.insert(tweet);

    T.post('statuses/update', {status: '@' + tweet.user.screen_name + ' OK, I\'ll try!', 
                               in_reply_to_status_id: tweet.id_str}, function(err, data, response) {    
          console.log(err);
    });
});


var sendReminders = function() {
    
        db.tweets.find({reminder_time:{$lte:Date.now()}}).forEach(function(err, tweet) {
	    if(err) {
                console.log("There was an error executing the database query.");
                return;
            }

            if(!tweet) {
               return;
            }
                 
            T.post('statuses/update', 
                        {status: '@' + tweet.user.screen_name + 
                                    ' Here\'s your reminder! Have a great day :)', 
                               in_reply_to_status_id: tweet.id_str}, 
                 function(err, data, response) {
                                 console.log(err);
                 });
            db.tweets.remove(tweet);
        });

};

sendReminders();

setInterval(sendReminders, 60000);
