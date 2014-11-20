var Twit = require('twit')

var T = new Twit({
    consumer_key:         'FOHJfcWiJE2tFBGrZtqMM4wIh'
  , consumer_secret:      'n9NZQhYKzKJp431hIdlorNKLYWKVgNIElBIaE4sQ71pbyBa82K'
  , access_token:         '2885734899-Ib3OdFxDaCSW3o31FoVuQpDcc2B6LisYAzF9LVK'
  , access_token_secret:  'RSXkSuF0NbvVIhTcCD64YnE0TvWCJbcfSuTYiD7FOutYP'
})

//
//  tweet 'hello world!'
//
/*T.post('statuses/update', { status: 'hello world!' }, function(err, data, response) {
  console.log(data)
})
*/


var stream = T.stream('statuses/filter', { track: 'remind me tomorrow' })

stream.on('tweet', function (tweet) {
    console.log('@' + tweet.user.screen_name + ': ' + tweet.text);
    
    if (tweet.user.screen_name == 'RemindMe__') {
      return;
    }

    T.post('statuses/retweet/:id', { id: tweet.id_str }, function(err, data, response) {
        console.log(err);
    });

    T.post('statuses/update', {status: '@' + tweet.user.screen_name + ' OK, I\'ll try!', 
                               in_reply_to_status_id: tweet.id}, function(err, data, response) {});
});
