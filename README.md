# Budget Tracker ![node.js badge](https://img.shields.io/static/v1?label=node.js&message=enabled&color=success)![MongoDB](https://img.shields.io/static/v1?label=MongoDB&message=enabled&color=success)

## Description
This budget tracker takes advantage of Node, Express, and MongoDB/Mongoose to log a budget online.

It allows the user to update a budget, inserting into, and removing money with each transaction.
It logs each payment/expenditure, and displays them on a graph.
It also takes advantage of webmanifest and ServiceWorkers to become a PWA, and works exatly the same offline, temporarily storing data into an IndexeDB.
Data is synced from local IndexeDB to the web when next connected & viewed.

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
* [License](#license)
* [Credits](#contributing)
* [Testing](#tests)
* [Questions](#questions)
* [Demo](#demo)

## Installation
```
npm install
Set up Mongodb
```
## Usage
```
npx nodemon server.js
```
## License
MIT

## Contributing
[brian-fairbanks](https://github.com/Brian-Fairbanks)

## Tests
Manually tested.  No additinal frameworks used.

## Questions
<img src="https://avatars0.githubusercontent.com/u/59707181?v=4" height="48" width="48"> | brian.k.fairbanks@gmail.com

## Demo
Hosted on heroku [bkf-budget-tracker](https://bkf-budget-tracker.herokuapp.com/)
