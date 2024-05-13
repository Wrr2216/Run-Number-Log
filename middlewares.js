/*
 * Copyright (c) 2024 Logan Miller
 * All rights reserved.
 *
 * This code is the property of Miller Cyber Technologies LLC.
 * Unauthorized use or distribution of this code is strictly prohibited.
 */

var devOverride = process.env.NODE_ENV === "dev";

module.exports = {
    // Restricts the current user.
  restrictor: function restrict(req, res, next) {
    if (req.session.loggedin) {
      next();
    } else {
      req.session.error = "Access denied!";
      res.redirect("/");
    }
  },
};
