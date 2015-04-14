var username = 'TopOfTheBots';


var Twit = require('twit');

var fs = require('fs');
var secrets = JSON.parse(fs.readFileSync('secrets-topofthebots.json', 'utf8'));

var T = new Twit(secrets);

var randomEntry = function(array) {
    return array[Math.floor(Math.random()*array.length)];
}

var retweetSomething = function(ids) {
    console.log("--- Trying retweet ---"); 
    var id = randomEntry(ids);

    console.log("--- User: " + id + " chosen ---");

    T.get('users/lookup', {user_id: [id]}, function(err, users, response){
        if (err) { console.log(err); return; };
        T.post('statuses/retweet/:id', 
            { id: users[0].status.id_str }, function(err, data, response) {
            if (err) {
                console.log("----- Retweet Error ---------");
                console.log(err);
                retweetSomething(ids);
            } else {
                console.log("Retweeted: " + data.text);
            }
        }); 
    });
};

var followFromPage = function(p, friendIds, ignoreIds) {
    
    var done = false;

    var wait = true;

    var searchStrings = ['bot', 'twitter bot', 'twit bot', 'comedy bot', 
                         'joke bot', 'a bot', 'a twitter bot', 'twitterbot',
                         'picture bot', 'art bot', 'video bot', 'pic bot',
                         'word bot', 'story bot', 'image bot'];

    var search = randomEntry(searchStrings);
    console.log("--- Searching: " + search + " ---");

    T.get('users/search', { q: search}, 
    function (err, data, response) {
        if (err) { console.log(err); return false; };
        
        var tryFollowUser = function(userIndex) {
            if (userIndex >= data.length) return;
 
            var user = data[userIndex];

            console.log("--- Trying to follow @" + user.screen_name + " ---");

            if( user.lang == "en" && 
                friendIds.indexOf(user.id) == -1 &&
                ignoreIds.indexOf(user.id) == -1) {

                var waitInner = true; 

                T.post('friendships/create', {user_id: user.id},
                function(err, data, response) {
                   if(!err) {
                       console.log("--- Followed: @" + data.screen_name +
                                   " ---");
                       done = true;
                   } else {
                       console.log("----- Follow Error ---------");
                       console.log(err);
                   }
                   waitInner = false;
                });
                        
                var loop = function() {
                    if (waitInner) {
                        setTimeout(loop, 1000);
                    } else if (!done) {
                        tryFollowUser(userIndex+1);
                    } else {
                        wait = false;
                    }
                };    

                loop();
            } else {
                tryFollowUser(userIndex+1);
            }
        }

        tryFollowUser(0);
    });       

    var loop = function() {
       if (wait) {
            setTimeout(loop, 1000);
       } else if (!done) {
            followFromPage(p+1, friendIds, ignoreIds);
       }
    };

    loop();
};

var update = function() {
    T.get('friends/ids', { screen_name: username }, 
    function (err, friends, response) {
        
        if (err) { console.log(err); return; };

        retweetSomething(friends.ids);
        setTimeout(function() { return retweetSomething(friends.ids); }, 
                   50 * 60 * 1000);

        db.ignore.find(function(err, ignorelist) {
            followFromPage(1, friends.ids, ignorelist);
        });
    });
};

var mongojs = require("mongojs");

var uri = 'localhost:27017/RemindMe';
var db = mongojs.connect(uri, ["ignore"]);

var ignoreme = T.stream('statuses/filter', { track: username + ' #ignoreme' })

ignoreme.on('tweet', function (tweet) {
    db.ignore.insert(tweet.user.id);

    T.post('friendships/destroy', {user_id: tweet.user.id},
    function(err, data, response) {
        if (err) { console.log(err); return; };
        T.post('statuses/update', {status: '@' + tweet.user.screen_name + 
                               ' No problem. Sorry if I\'ve been annoying :/' +
                               ' Use #stopignoringme if you change your mind...', 
                               in_reply_to_status_id: tweet.id_str},
        function(err, data, response) {    
            if (err) { console.log(err); return; };
        });
    }); 

});

var followme = T.stream('statuses/filter', { track: username + ' #stopignoringme' })

followme.on('tweet', function (tweet) {
    db.ignore.remove(tweet.user.id);
    
    T.post('friendships/create', {user_id: tweet.user.id},
    function(err, data, response) {
        if (err) { console.log(err); return; };
        T.post('statuses/update', {status: '@' + tweet.user.screen_name + 
                               ' Followed!', 
                               in_reply_to_status_id: tweet.id_str},
        function(err, data, response) {    
            if (err) { console.log(err); return; };
        });
    });
});

var ignorethem = T.stream('statuses/filter', { track: username + ' #ignorethem' })

ignorethem.on('tweet', function (tweet) {
    
    var mentions = '@' + tweet.user.screen_name; 
    
    var length = tweet.entities.user_mentions.length;
    for (var i = 0; i < length; i++) {
        var mention = tweet.entities.user_mentions[i];
        
        if (mention.screen_name != username) {
            mentions += ' @' + mention.screen_name;
            db.ignore.insert(mention.id);

            T.post('friendships/destroy', {user_id: mention.id},
            function(err, data, response) {
                if (err) { console.log(err); };
            }); 
        }
    }

    
    T.post('statuses/update', {status: mentions + 
                               ' Ok. If you say so...', 
                               in_reply_to_status_id: tweet.id_str},
    function(err, data, response) {    
        if (err) { console.log(err); return; };
    });
});

var followthem = T.stream('statuses/filter', { track: username + ' #followthem' })

followthem.on('tweet', function (tweet) {

    var mentions = '@' + tweet.user.screen_name; 

    var count = 0;
    var length = tweet.entities.user_mentions.length;
    for (var i = 0; i < length; i++) {
        var mention = tweet.entities.user_mentions[i];
        if (mention.screen_name != username) {
            mentions += ' @' + mention.screen_name;
            count++;
            db.ignore.remove(mention.id);
            
            T.post('friendships/create', {user_id: mention.id},
            function(err, data, response) {
                if (err) { console.log(err); return; };
            });
        }
    }

    if (count < 1) return;
    
    
    T.post('statuses/update', {status: mentions + 
                               ' All done!', 
                               in_reply_to_status_id: tweet.id_str},
    function(err, data, response) {    
        if (err) { console.log(err); return; };
    });

});


update();

setInterval(update, 100 * 60 * 1000);
