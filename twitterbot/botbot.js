
var Twit = require('twit');

var fs = require('fs');
var secrets = JSON.parse(fs.readFileSync('secrets-botbot.json', 'utf8'));

var T = new Twit(secrets);

var update = function() {
    T.get('friends/ids', { screen_name: 'TheBotLovingBot' },
          function (err, friends, response) {
        
        var done = false;

        T.get('users/search', 
              { q: 'bot', lang: 'en' }, 
                 function (err, data, response) {
                data.forEach(function(entity) {
                    if ( !done &&
                         friends.ids.indexOf(entity.id) == -1 &&
                         entity.lang == "en") {

                        T.post('friendships/create', {user_id: entity.id},
                               function(a,b,c) {});
                        console.log(entity);
                        done = true;
                  }
                });
            });
                
          });

};

update();

setInterval(update, 30 * 60 * 1000);
