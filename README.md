# Udacity Mobile Web Specialist Certification Course

## Restaurant Reviews Project Overview: Stage 3

This **Restaurant Reviews** project was created for Udacity's Mobile Web Specialist Nanodegree. To see the state of the project before I implemented my own changes, you can visit [Udacity's starter code repo](https://github.com/udacity/mws-restaurant-stage-1).

My submission for [Stage 1](https://github.com/terichadbourne/mws-restaurant-reviews/tree/stage-1-final) of the 3-part project took a static design that lacks accessibility and converts the design to be responsive on different sized displays and accessible for screen reader use. It also added a service worker to begin the process of creating a seamless offline experience for my users.

In [Stage 2](https://github.com/terichadbourne/mws-restaurant-reviews/tree/stage-2-final), I accessed restaurant info and reviews from a server rather
than storing it in a local JSON file. JSON responses from the server were cached using the IndexedDB API, and any data previously accessed while connected was made available while offline.

Now in Stage 3, I'm accessing a new server which delivers restaurant info
separately from reviews. Users can now mark restaurants as favorites, with the database updated as needed. They can also now add their own restaurant reviews, even if offline, and those reviews will be sent to the server when a connection is available.

See below for instructions to run this app locally.
________________


<div>
  <img src="https://user-images.githubusercontent.com/19171465/111891888-be103900-89cc-11eb-92a0-9faf52850df1.png" height="400">
  <img src="https://user-images.githubusercontent.com/19171465/111891971-5dcdc700-89cd-11eb-9e18-265aa617afb3.png" height="400">
  <img src="https://user-images.githubusercontent.com/19171465/111892014-cae15c80-89cd-11eb-83ac-fcbed5b32e43.png" height="400">
</div>
<div>
  <img src="https://user-images.githubusercontent.com/19171465/111892071-4b07c200-89ce-11eb-8449-de67c7dc154a.png" height="400">
  <img src="https://user-images.githubusercontent.com/19171465/111892164-4f80aa80-89cf-11eb-957e-53c9716ea96e.png" height="400">
</div>

________________________________


### How to run this app

#### Run the server

1. Fork and clone the separate [server repo](https://github.com/terichadbourne/mws-restaurant-stage-3-server).
2. Navigate into your server directory from the command line.
3. Install project dependancies with `npm i`.
4. Install Sails.js globally with `npm i sails -g`.
5. Start the server with `node server`.
6. You can find a detailed [list of endpoints](https://github.com/terichadbourne/mws-restaurant-stage-3-server/blob/master/README.md) made available by the API in the README of the server repo. 

You're now ready to run the client app.

#### Run the client

1. Fork and clone [this repository](https://github.com/terichadbourne/mws-restaurant-reviews).

2. This project uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. However, since tokens should be confidential, you will not find my active token in this repo and will need to get your own. After acquiring a token from [Mapbox](https://www.mapbox.com/), navigate to the root directory in the command line and create a hidden file to store it in. To do this, type `touch js/.secrets.js`. Be sure to match this filename exactly, as it is referenced in the code and prevented from accidental upload to GitHub by its inclusion in the `.gitignore` file.

3. Open your `js/.secrets.js` file and add the line of code: `const topSecretMapboxToken = '<YOUR MAPBOX API KEY HERE>'` (keep the quotes and remove the < > when inserting your own token). Save this file and do `git status` from the command line to ensure no change is registered by git (which will be the case if you named the file properly).

4. From the main project directory, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000`. For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

5. With your server running, visit the site at: `http://localhost:8000` (SECURITY NOTE: Viewers of your localhost application can still discover your Mapbox token by revealing the source code through dev tools.)

#### Test offline functionality

To test offline functionality on localhost, you will either need to kill your server (`Ctrl-C`) or turn on offline mode in your dev tools. (<a href="https://developers.google.com/web/ilt/pwa/tools-for-pwa-developers#simulate_offline_behavior">Learn how how to simulate offline behavior</a> in Chrome and Firefox.)

Remember, you must always visit a site once while online to cache resources before it becomes accessible offline.
