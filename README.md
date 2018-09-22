# Udacity Mobile Web Specialist Certification Course

## Restaurant Reviews Project Overview: Stage 1

This **Restaurant Reviews** project was created for Udacity's Mobile Web Specialist Nanodegree. My submission for Stage 1 of the 3-part project takes a static design that lacks accessibility and converts the design to be responsive on different sized displays and accessible for screen reader use. It also adds a service worker to begin the process of creating a seamless offline experience for my users.

To see the state of the project before I implemented my own changes, you can visit [Udacity's starter code repo](https://github.com/udacity/mws-restaurant-stage-1).

### How to run this app

1. Fork and clone this repository.

2. This project uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. However, since tokens should be confidential, you will not find my active token in this repo and will need to get your own.

After acquiring a token from [Mapbox](https://www.mapbox.com/), navigate to the root directory in the command line and create a hidden file to store it in. To do this, type `touch js/.secrets.js`. Be sure to match this filename exactly, as it is referenced in the code and prevented from accidental upload to GitHub by its inclusion in the `.gitignore` file.

3. Open your `js/.secrets.js` file and add the line of code: `const topSecretMapboxToken = '<YOUR MAPBOX API KEY HERE>'` (keep the quotes and remove the < > when inserting your own token). Save this file and do `git status` from the command line to ensure no change is registered by git (which will be the case if you named the file properly).

4. From the main project directory, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer.

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000`. For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

5. With your server running, visit the site at: `http://localhost:8000` (SECURITY NOTE: Viewers of your localhost application can still discover your Mapbox token by revealing the source code through dev tools.)

6. If you want to test offline functionality on localhost, you will either need to kill your server (`Ctrl-C`) or turn on offline mode in Chrome or Firefox dev tools. (Remember, you must always visit a site once while online to cache resources before it becomes accessible offline.)
