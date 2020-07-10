const winston = require('winston');
//require('winston-mongodb');
require('express-async-errors');

module.exports = function () {
  process.on('unhandledRejection', (ex) => {
    throw ex;
    /*  winston.error(ex.message, ex);
      process.exit(1);*/
  });
  winston.add(new winston.transports.Console({ colorize: true, prettyPrint: true }));
  winston.exceptions.handle(new winston.transports.File({ filename: 'uncaughtException.log' }));

  winston.add(new winston.transports.File({ filename: 'logfile.log' }));
/*  winston.add(new winston.transports.MongoDB({
    level: 'error',
    db: 'mongodb://localhost/vidly'
  }));*/
};