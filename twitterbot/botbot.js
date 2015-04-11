
var Twit = require('twit');

var fs = require('fs');
var secrets = JSON.parse(fs.readFileSync('secrets-botbot.json', 'utf8'));

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

var followFromPage = function(p, friendIds) {
    
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

            if( friendIds.indexOf(user.id) == -1 &&
                user.lang == "en") {

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
            followFromPage(p+1, friendIds);
       }
    };

    loop();
};

var update = function() {
    T.get('friends/ids', { screen_name: 'TheBotLovingBot' }, 
    function (err, friends, response) {
        
        if (err) { console.log(err); return; };

        retweetSomething(friends.ids);
        setTimeout(function() { return retweetSomething(friends.ids); }, 
                   15 * 60 * 1000);


        followFromPage(1, friends.ids);
       
    });
};

update();

setInterval(update, 60 * 60 * 1000);
