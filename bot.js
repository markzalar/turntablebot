var Bot = require('ttapi');
var http = require('http');
var urban = require('urban');
var globals = require('./globals');
var AUTH = globals.AUTH;
var USERID = globals.USERID;
var ROOMID = globals.ROOMID;
var COMMAND_TRIGGER = globals.COMMAND_TRIGGER;
var autobob = true;
var chatty = false;
var countdownName = 'DJ XXXXX';
var countdownScore = '10000';
var scoreReached = false;
var currentlyDJing = false;
var bot = new Bot(AUTH, USERID, ROOMID);

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

function define(query, callback) {
  var response = urban(query);
  response.first(function(json) {
    var definition;
    if(json.definition && query.length > 0){
      definition = json.definition;
    }
    else {
      definition = "I don't know that one.";
    }
    callback(definition);
  });
}

function example(query, callback) {
  var response = urban(query);
  response.first(function(json) {
    var example;
    if(json.example && query.length > 0){
      example = json.example;
    }
    else {
      example = "I don't have an example of that.";
    }
    callback(example);
  });
}

function speakAboutSong(data) {
  var phrases = [];
  var d = data;

  function getSongExample(query) {
    var response = urban(query);
    response.first(function(json) {
      if(json.example && query.length > 0){
        phrases.push(json.example);
      }
      getSongDefinition(query);
    });
  }

  function getSongDefinition(query) {
    var response = urban(query);
    response.first(function(json) {
      if(json.definition && query.length > 0){
        phrases.push(json.definition);
      }
      getArtistExample(d.room.metadata.current_song.metadata.artist);
    });
  }

  function getArtistExample(query) {
    var response = urban(query);
    response.first(function(json) {
      if(json.example && query.length > 0){
        phrases.push(json.example);
      }
      getArtistDefinition(query);
    });
  }

  function getArtistDefinition(query) {
    var response = urban(query);
    response.first(function(json) {
      if(json.definition && query.length > 0){
        phrases.push(json.definition);
      }
      if(phrases.length > 0) {
        saySomething();
      }
      else {
        getAlbumExample(d.room.metadata.current_song.metadata.album); 
      }
    });
  }

  function getAlbumExample(query) {
    var response = urban(query);
    response.first(function(json) {
      if(json.example && query.length > 0){
        phrases.push(json.example);
      }
      getAlbumDefinition(query);
    });
  }

  function getAlbumDefinition(query) {
    var response = urban(query);
    response.first(function(json) {
      if(json.definition && query.length > 0){
        phrases.push(json.definition);
      }
      saySomething(); 
    });
  }

  function saySomething() {
    if(phrases.length > 0) {
      bot.speak(phrases[Math.floor(Math.random()*phrases.length)]);
    }
  }

  getSongExample(d.room.metadata.current_song.metadata.song);

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
          define(command.slice(1).join(" "), function(definition) {bot.speak(definition);});
        }
        break;
      case "example":
        if (command.length > 1) {
          example(command.slice(1).join(" "), function(example) {bot.speak(example);});
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
        if (name == countdownName){
          var points = data2.users[i].points;
          if (points < countdownScore){
            bot.speak(countdownScore - points);
          }
          else if (points == countdownScore) {
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
  bot.speak("wooooooo " + name);
}
