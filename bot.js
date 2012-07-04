var Bot = require('ttapi');
var http = require('http');
var OAuth = require('oauth').OAuth;
var urban = require('urban');
var globals = require('./globals');
var AUTH = globals.AUTH;
var USERID = globals.USERID;
var ROOMID = globals.ROOMID;
var TWITTER_TOKEN = globals.TWITTER_TOKEN;
var TWITTER_SECRET = globals.TWITTER_SECRET;
var TWITTER_CONSUMERKEY = globals.CONSUMERKEY;
var TWITTER_CONSUMERSECRET = globals.CONSUMERSECRET;
var COMMAND_TRIGGER = globals.COMMAND_TRIGGER;
var autobob = true;
var chatty = false;
var countdownScore = [1000, 3000, 10000, 20000];
var scoreReached = false;
var currentlyDJing = false;
var bot = new Bot(AUTH, USERID, ROOMID);
twitterer = new OAuth(
                          "https://api.twitter.com/oauth/request_token",
                          "https://api.twitter.com/oauth/access_token",
                          TWITTER_CONSUMERKEY,
                          TWITTER_CONSUMERSECRET,
                          "1.0",
                          null,
                          "HMAC-SHA1"
                    );

function sleep(milliseconds) {
  var start = new Date().getTime();

  while(new Date().getTime() < start + milliseconds) {
    //do nothing
  }
}

function toggleAutobob(){
  if (!autobob) {
    autobob = true;
    bot.speak("on");
  }
  else {
    autobob = false;
    bot.speak("off");
  }
}

function toggleChatty() {
  if (!chatty) {
    chatty = true;
    bot.speak("on");
  }
  else {
    chatty = false;
    bot.speak("off");
  }
}

function lookup(query, callback) {
  var response = urban(query);
  response.first(function(json) {
    var entry = {}
    if(json.definition && query.length > 0){
      entry['definition'] = json.definition;
    }
    else {
      entry['definition'] = "";
    }
    if(json.example && query.length > 0){
      entry['example'] = json.example;
    }
    else {
      entry['example'] = "";
    }
    callback(entry);
  });
}

function sayRandomPhrase(phrases) {
  if(phrases.length > 0) {
    bot.speak(phrases[Math.floor(Math.random()*phrases.length)]);
  }
}

function speakAboutSong(data) {
  var phrases = [];
  var song = data.room.metadata.current_song.metadata.song;
  var artist = data.room.metadata.current_song.metadata.artist;
  var album = data.room.metadata.current_song.metadata.album;

  lookup(song, function(entry) {
    if(entry['definition'].length > 0) {
      phrases.push(entry['definition']);
    }
    if(entry['example'].length > 0) {
      phrases.push(entry['example']);
    }
    lookup(artist, function(entry) {
      if(entry['definition'].length > 0) {
        phrases.push(entry['definition']);
      }
      if(entry['example'].length > 0) {
        phrases.push(entry['example']);
      }
      if(phrases.length > 0) {
        sayRandomPhrase(phrases);
      }
      else {
        lookup(song, function(entry) {
          if(entry['definition'].length > 0) {
            phrases.push(entry['definition']);
          }
          if(entry['example'].length > 0) {
            phrases.push(entry['example']);
          }
          sayRandomPhrase(phrases);
        });
      }
    });
  });
}

function answerYesNo() {
  var phrases = [];
  phrases.push("yes");
  phrases.push("no");
  phrases.push("definitely");
  phrases.push("no way");
  phrases.push("absolutely");
  phrases.push("absolutely not");
  bot.speak(phrases[Math.floor(Math.random()*phrases.length)]);
}

function tweet(text) {
  twitterer.post("http://api.twitter.com/1/statuses/update.json",
                 TWITTER_TOKEN,
                 TWITTER_SECRET,
                 ({'status': text}),
                 "application/json",
                 function (error, data, response2) {
                  if (error) {
                    console.log('Error: '+JSON.stringify(error)+'\n');
                    for (i in response2) {
                      out = i + ' : ';
                      try {
                        out += response2[i];
                      }
                      catch (err) {}
                      out += '\n';
                      console.log(out);
                    }
                  }
                  else {
                    console.log('Twitter status updated.');
                  }
                 });
}

bot.on('speak', function (data) {
  if (data.text.substring(0,COMMAND_TRIGGER.length) == COMMAND_TRIGGER) {
      var command = data.text.substring(COMMAND_TRIGGER.length).split(/\s+/);
      switch (command[0]) {
      case "autobob":
        if (command.length == 1) {
          toggleAutobob();
        }
        break;
      case "chatty":
        if (command.length == 1) {
          toggleChatty();
        }
        break;
      case "bob":
      case "dance":
      case "boogie":
      case "awesome":
      case "shake":
      case "groove":
      case "shuffle":
      case "waltz":
      case "bounce":
        bot.vote('up');
        break;
      case "stop":
      case "lame":
        bot.vote('down');
        break;
      case "define":
        if (command.length > 1) {
          lookup(command.slice(1).join(" "), function(entry) {
            if(entry['definition'].length > 0) {
              bot.speak(entry['definition']);
            }
            else {
              bot.speak("I don't know a definition for that");
            }
          });
        }
        break;
      case "example":
        if (command.length > 1) {
          lookup(command.slice(1).join(" "), function(entry) {
            if(entry['example'].length > 0) {
              bot.speak(entry['example']);
            }
            else {
              bot.speak("I don't know an example of that");
            }
          });
        }
        break;
      case "do":
      case "does":
      case "did":
      case "will":
      case "am":
      case "are":
      case "is":
      case "were":
      case "can":
      case "could":
      case "would":
      case "should":
        if (data.text.substr(-1) === "?") {
          answerYesNo();
        }
        break;
      case "tweet":
        if (command.length > 1) {
          tweet(command.slice(1).join(" "));
        }
        break;
      default:
        bot.speak("sup");
      }
  }
});

bot.on('newsong', function(data) {
  if (autobob){
    //start bobbing when a new song starts after waiting a random number of seconds first 
    sleep((Math.floor(Math.random()*2) + 1) * 1000);
    bot.vote('up');
  }
  if(chatty) {
    speakAboutSong(data);
  }
  //Handle DJing if only 1 real DJ
  bot.roomInfo(extended=false, function(data2) {
    djCount = data2.room.metadata.djs.length;
    currDJ = data2.room.metadata.current_dj;
    currentlyDJing = false;
    for (var i = 0; i < data2.room.metadata.djs.length; i++) {
      if (data2.room.metadata.djs[i] == USERID) {
        currentlyDJing = true;
      }
    }
    if (djCount == 1 && currentlyDJing) {
      bot.remDj();
    }
    if (djCount == 1 && !currentlyDJing) {
      bot.addDj();
    }
    else if (djCount > 2 && currentlyDJing && currDJ != USERID) {
      bot.remDj();
    }
  });
});

bot.on('update_votes', function(data) {
  //Call out Lamers
  if (data.room.metadata.votelog[0][1] == "down")
  {
    lameID = data.room.metadata.votelog[0][0];
    if (lameID == '') {
      bot.speak('Somebody Lamed!');
    }
    else {
      bot.roomInfo(extended=false, function(lameData) {
        for (var i = 0; i < lameData.users.length; i++) {
          if (lameData.users[i].userid == lameID && lameID != USERID) {
           bot.speak(lameData.users[i].name + " Lamed!");
          }
        }
      });
    }
  }
  bot.roomInfo(extended=false, function(data2) {
    currDJ = data2.room.metadata.current_dj;
    for (var i = 0; i < data2.users.length; i++) {
      if (data2.users[i].userid == currDJ) {
        var name = data2.users[i].name;
        var points = data2.users[i].points;
        for (var i = 0; i < countdownScore.length; i++) {
          if ((points < countdownScore[i]) && (points > (countdownScore[i] - 50))){
            bot.speak(countdownScore[i] - points);
          }
          else if (points == countdownScore[i]) {
            if (!scoreReached) {
              scoreReached = true;
              celebrate(name);
            }
          }
        }
      }
    }
  });
});

bot.on('add_dj', function(data) {
  bot.roomInfo(extended=false, function(data2) {
    djCount = data2.room.metadata.djs.length;
    currentlyDJing = false;
    currDJ = data2.room.metadata.current_dj;
    for (var i = 0; i < data2.room.metadata.djs.length; i++) {
      if (data2.room.metadata.djs[i] == USERID) {
        currentlyDJing = true;
      }
    }
    if (djCount == 1 && !currentlyDJing) {
      bot.addDj();
    }
    else if (djCount > 2 && currentlyDJing && currDJ != USERID) {
      bot.remDj();
    }
  });
});

bot.on('rem_dj', function(data) {
  bot.roomInfo(extended=false, function(data2) {
    djCount = data2.room.metadata.djs.length;
    currentlyDJing = false;
    for (var i = 0; i < data2.room.metadata.djs.length; i++) {
      if (data2.room.metadata.djs[i] == USERID) {
        currentlyDJing = true;
      }
    }
    if (djCount == 1 && currentlyDJing) {
      bot.remDj();
    }
    else if (djCount == 1 && !currentlyDJing) {
      bot.addDj();
    }
  });
});

function celebrate(name) {
  var phrases = [];
  phrases.push("http://i.imgur.com/ThTIK.gif");
  phrases.push("http://i.imgur.com/fdxqb.gif");
  phrases.push("http://i.imgur.com/Wg30M.gif");
  phrases.push("http://i.imgur.com/AxBf6.gif");
  phrases.push("http://i.imgur.com/SnV8L.gif");
  phrases.push("http://i.imgur.com/uiLIi.gif");
  phrases.push("http://i.imgur.com/G9wDI.gif");
  phrases.push("http://i.imgur.com/mGUXG.gif");
  phrases.push("http://i.imgur.com/lDT7o.gif");
  phrases.push("http://i.imgur.com/1lSYs.gif");
  phrases.push("http://i.imgur.com/kGedl.gif");
  phrases.push("http://i.imgur.com/ocY1w.gif");
  phrases.push("http://i.imgur.com/u276s.gif");
  phrases.push("http://i.imgur.com/neAVc.gif");
  phrases.push("http://chzgifs.files.wordpress.com/2011/04/groovyconductorp1.gif");
  phrases.push("http://i.imgur.com/qAXVs.gif");
  phrases.push("http://i.imgur.com/u32TL.gif");
  phrases.push("http://i.minus.com/irG2kMg4qnvIS.gif");
  phrases.push("http://i.imgur.com/aarEk.gif");
  phrases.push("http://i.imgur.com/rNqoG.gif");
  phrases.push("http://gifs.gifbin.com/200sw35799sw.gif");
  phrases.push("http://i.imgur.com/16NYX.gif");
  phrases.push("http://i.imgur.com/qhLXn.gif");
  phrases.push("http://gifs.gifbin.com/reverse-sw3yu28swyuyu8.gif");
  phrases.push("http://i.imgur.com/HyqRk.gif");
  phrases.push("http://gifsoup.com/view1/3731992/sexytime-gregg-o.gif");
  phrases.push("http://i.minus.com/ikqx3g.gif");
  phrases.push("http://i.imgur.com/yA6aZ.gif");
  phrases.push("http://i.imgur.com/YKPeT.gif");
  phrases.push("http://i.imgur.com/F9BbH.gif");
  phrases.push("http://i.imgur.com/TwG2L.jpg");
  phrases.push("http://i.imgur.com/LapZi.gif");
  phrases.push("http://i.imgur.com/j9c91.gif");
  phrases.push("http://i.imgur.com/tts7t.gif");
  phrases.push("http://i.imgur.com/K7UeP.gif");
  phrases.push("http://www.reactiongifs.com/wp-content/uploads/2012/05/wtrbi1.gif");
  phrases.push("http://i.imgur.com/HrxQE.gif");
  phrases.push("http://i.imgur.com/dW7Jg.gif");
  phrases.push("http://www.reactiongifs.com/wp-content/gallery/yes/kevthumb.gif");
  phrases.push("http://i.imgur.com/igmqE.gif");
  phrases.push("http://i.imgur.com/3WuUh.gif");
  phrases.push("http://i.imgur.com/wiOUr.gif");
  phrases.push("http://i.imgur.com/N9btE.gif");
  phrases.push("http://i.imgur.com/fzCHB.gif");
  phrases.push("http://i.imgur.com/q7aWb.gif");
  phrases.push("http://i.imgur.com/B2dU4.gif");
  phrases.push("http://i.imgur.com/wiOUr.gif");
  phrases.push("http://i.imgur.com/hboQH.gif");
  phrases.push("http://i.imgur.com/MwPFQ.gif");
  phrases.push("http://i.imgur.com/LtOgs.gif");
  phrases.push("http://i.imgur.com/5U72E.gif");
  phrases.push("http://i.imgur.com/gZ0zS.gif");
  phrases.push("http://i.imgur.com/FEGe2.gif");
  phrases.push("http://i.imgur.com/HICIa.gif");
  phrases.push("http://i.imgur.com/uWDGL.gif");
  phrases.push("http://i.imgur.com/Jkhla.gif");
  phrases.push("http://i.imgur.com/INCeN.gif");
  phrases.push("http://i.imgur.com/khNiN.gif");
  phrases.push("http://i.imgur.com/M4of9.gif");
  phrases.push("http://i.imgur.com/ZMikj.gif");
  phrases.push("http://i.imgur.com/Cqv60.gif");
  phrases.push("http://i.imgur.com/E6Xd8.gif");
  phrases.push("http://i.imgur.com/igud4.gif");
  phrases.push("http://i.imgur.com/AFRvw.gif");
  phrases.push("http://i.imgur.com/SrVgh.gif");
  phrases.push("http://i.imgur.com/f6I8y.gif");
  phrases.push("http://i.imgur.com/JGRRy.gif");
  phrases.push("http://i.imgur.com/pRF2p.gif");
  phrases.push("http://bit.ly/I6VwOG");
  phrases.push("http://bit.ly/ycmooS");
  phrases.push("http://bit.ly/LLy50N");
  phrases.push("http://bit.ly/LxXcS7");
  phrases.push("http://bit.ly/PezKPK");
  phrases.push("http://bit.ly/N7yiHD");
  phrases.push("http://bit.ly/OpG2cS");
  phrases.push("http://bit.ly/hmtBZo");
  phrases.push("http://bit.ly/dIr6oY");
  phrases.push("http://bit.ly/N7ypTB");
  phrases.push("http://bit.ly/PeAfJC");
  phrases.push("http://bit.ly/ytOVaw");
  phrases.push("http://bit.ly/MUUkyI");
  phrases.push("http://bit.ly/MJEBGx");
  phrases.push("http://bit.ly/nbjRaE");
  phrases.push("http://bit.ly/InWHbM");
  phrases.push("http://bit.ly/gRhr5X");

  bot.speak("wooooooo " + name);
  sleep(5000);
  for (var i = 0; i < 10; i++) {
    var randomIndex = Math.floor(Math.random()*phrases.length);
    bot.speak(phrases[randomIndex]);
    delete phrases[randomIndex];
    sleep(5000);
  }
}
