Crowd Control
=============

Crowd control allows you to monitor capacity across multiple entrances/exits in real time using computers and smartphones.

Installation
------------
To install, use npm to download the following modules: express (MVC library), jqtpl (templating system), socket.io (for real-time updates) with the following command:

    npm install express jqtpl socket.io

Also, if not running locally, you will also need to edit public/javascripts/main.js:4 to point to your server.

Usage
-----
To start, run the following:

    node app.js
