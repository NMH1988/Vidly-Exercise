const express = require('express');
const app = express();
const winston = require('winston');
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/logging')();
require('./startup/configuration')();

//throw new Error('Something failed during startup');
/*const p = Promise.reject(new Error('Something failed miserably'));
p.then(() => console.log('Done'));*/

const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;