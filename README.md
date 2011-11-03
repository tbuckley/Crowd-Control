Crowd Control
=============

Crowd control allows you to monitor capacity across multiple entrances/exits in real time using computers and smartphones.

Installation
------------
To install, use npm to download the following modules: express (MVC library), jqtpl (templating system), socket.io (for real-time updates), mongoose (MongoDB interface). You can do this all at once with the following command:

    npm install express jqtpl socket.io mongoose

You will also need to install MongoDB if you haven't already. You can download it from http://www.mongodb.org/downloads or using [Homebrew](http://mxcl.github.com/homebrew/) on Mac:

    brew install mongodb

Also, if not running locally, you will also need to edit public/javascripts/main.js:4 to point to your server.

Usage
-----
To start Crowd Control, run the following:

    node app.js

If not already running, you'll also need to start MongoDb:

    mongod --config mongo.config
