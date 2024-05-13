/*
 * Copyright (c) 2024 Logan Miller
 * All rights reserved.
 *
 * This code is the property of Miller Cyber Technologies LLC.
 * Unauthorized use or distribution of this code is strictly prohibited.
 */

var config = {};
config.email = {};
config.sql = {};

const user = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;
const host = process.env.SQL_HOST;
const database = process.env.SQL_DATABASE;
const dev = process.env.SQL_DEV;

config.sql.host = host;
config.sql.user = user;
config.sql.password = password;
config.sql.database = database;
config.sql.dev = false;

module.exports = config;