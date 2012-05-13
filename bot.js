var Bot = require('ttapi');
var http = require('http');
var urban = require('urban');
var globals = require('./globals');
var AUTH = globals.AUTH;
var USERID = globals.USERID;
var ROOMID = globals.ROOMID;
var COMMAND_TRIGGER = globals.COMMAND_TRIGGER;
var autobob = false;
var chatty = true;
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

function define(query) {
  var response = urban(query);
  response.first(function(json) {
    if(json.definition && query.length > 0){
      bot.speak(json.definition);
    }
    else {
      bot.speak("I don't know that one."); 
    }
  });
}

function example(query) {
  var response = urban(query);
  response.first( function(json) {
    if(json.example && query.length > 0){
      bot.speak(json.example && query.length > 0);
    }
    else {
      bot.speak("I don't have an example of that.");
    }
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
          define(command.slice(1).join(" "));
        }
        break;
      case "example":
        if (command.length > 1) {
          example(command.slice(1).join(" ")); 
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
    sleep((Math.floor(Math.random()*20) + 3) * 1000);
    bot.vote('up');
  }
  if(chatty) {
    speakAboutSong(data);
  }
});
