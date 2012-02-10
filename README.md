#TurntableBot
A bot for [turntable.fm](http://turntable.fm) that looks up words and phrases on
[urbandictionary.com](http://www.urbandictionary.com/).

This bot makes use of the following packages.
Alan Gilbert's [ttapi](https://github.com/alaingilbert/Turntable-API)
Murilo Santana's [urban](https://github.com/mvrilo/urban)
##Installation
Install [node.js](http://nodejs.org/).  You'll also need [npm](http://npmjs.org/), but it
comes packaged with some of the node.js installers.

Install the packages/libraries.

    npm install urban
    npm install ttapi

At this point you have all you need to run the bot.  The next step is to
gather the authentication information for the room you'd like your bot
to join.

In bot.js, you'll see a few global variables for *AUTH*, *USERID*, and
*ROOMID*.  Use [this bookmarklet](http://alaingilbert.github.com/Turntable-API/bookmarklet.html) to find the values for those variables.

That's it.  To start the bot, run the following command.

    node bot.js

##Usage
The bot currently responds to the following commands.  Note that the
command trigger can be customized by modifying bot.js.  By default, the
bot is triggered for any chat message starting with BOT followed by one
of the following commands.

**bob/dance/boogie/awesome/shake/groove/shuffle/waltz/bounce**: awesome

**lame/stop**: lame

**define [WORD_OR_PHRASE]**: look up on urban dictionary and chat the first
definition

**example [WORD_OR_PHRASE]**: look up on urban dictionary and chat the
example for the first definition

**autobob**: toggle autobob (off by default)

**chatty**: toggle looking up of song/artist/album names and chatting
examples or definitions (on by default)
