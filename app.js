/*
 * Copyright (c) 2024 Logan Miller
 * All rights reserved.
 *
 * This code is the property of Miller Cyber Technologies LLC.
 * Unauthorized use or distribution of this code is strictly prohibited.
 */

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const config = require("./config");

var indexRouter = require('./routes/index');

var app = express();

if (process.env.NODE_ENV === "dev") {
  console.log("Development mode detected!");
}

if(config.sql.dev === true) {
  console.log("Database Development mode detected!");
}

const options = {
  host: config.sql.host,
  port: 3306,
  user: config.sql.user,
  password: config.sql.password,
  database: config.sql.database,
  clearExpired: true,
  endConnectionOnClose: true,
  connectionLimit: 100,
  maxIdleTime: 900000,
};

const sessionStore = new MySQLStore(options);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

sessionStore
  .onReady()
  .then(() => {
    // MySQL session store ready for use.
    console.log("DATABASE: MySQLStore ready");
  })
  .catch((error) => {
    // Something went wrong.
    console.error(error);
  });

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
  
app.use(
    session({
      key: "change-me",
      secret: "change-me-to-a-secret-value",
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
    })
  );

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
