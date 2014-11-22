var http = require("http"),
    mongojs = require("mongojs"); 


var uri = 'localhost:27017/RemindMe';
var db = mongojs.connect(uri, ["tweets"]);

var server = http.createServer(function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});

        db.tweets.find({}, function(err, records) {
	    if(err) {
                console.log("There was an error executing the database query.");
                response.end();
                return;
            }
            
            var html = '<h1>Tweets!</h2>',
                i = records.length;

            while(i--) {
               var user = 'undefined';
               if (typeof records[i].user != 'undefined') {
                   user = records[i].user.screen_name
               }

               html += '<p><b>@' + user + ':</b> ' 
                    + records[i].text 
               
               if (typeof records[i].timestamp_ms != 'undefined') {
                  var targetMilli = parseInt(records[i].timestamp_ms) + 60 * 60 * 18 * 1000;

                  html += ' <b>Time to reminder:</b> ' + Math.round(((targetMilli - Date.now())/ (1000 * 60)));
                  
                  html += ' <b><a href=\"http://twitter.com/' + user + '/status/' + records[i].id_str +
                          '\"> Link </a></b>'; 

               }
               if (typeof records[i].reminder_time != 'undefined') {
                   html += ' <b>NEW</b>';
               }
               html += '</p>';

               
            }

            response.write(html);
            response.end();
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

    var data = {};

    data.id = tweet.id;
    data.id_str = tweet.id_str;
    data.timestamp_ms = tweet.timestamp_ms;
    data.user = tweet.user;
    data.text = tweet.text;

    data.reminder_time = parseInt(tweet.timestamp_ms) + 60 * 60 * 18 * 1000;

    db.tweets.insert(data);

    T.post('statuses/update', {status: '@' + tweet.user.screen_name + ' OK, I\'ll try!', 
                               in_reply_to_status_id: tweet.id_str}, function(err, data, response) {
        console.log(err);
    });
});


setInterval(function() {
    
        db.tweets.find({}, function(err, records) {
	    if(err) {
                console.log("There was an error executing the database query.");
                response.end();
                return;
            }
            
            var i = records.length;

            while(i--) {
                  
                  if (typeof records[i].reminder_time !== 'undefined') {

                  if (Date.now() > parseInt(records[i].reminder_time)) {
                      T.post('statuses/update', 
                             {status: '@' + records[i].user.screen_name + 
                                      ' Here\'s your reminder! Have a great day :)', 
                               in_reply_to_status_id: records[i].id_str}, 
                             function(err, data, response) {
                                  console.log(err);
                             });
                      db.tweets.remove(records[i]);
                  }

                  } else {

                  if (Date.now() > parseInt(records[i].timestamp_ms) + 60 * 60 * 18 * 1000) {
                      T.post('statuses/update', 
                             {status: '@' + records[i].user.screen_name + 
                                      ' Here\'s your reminder! Have a great day :)', 
                               in_reply_to_status_id: records[i].id_str}, 
                             function(err, data, response) {
                                  console.log(err);
                             });
                      db.tweets.remove(records[i]);
                  }

                  }
            }
        });

}, 60000);
