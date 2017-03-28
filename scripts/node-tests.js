#!/usr/bin/env node

"use strict";

var path = require("path");

// make timers behave more stably
require("stable-timers").replaceGlobals();

global.$DOM = require(path.join("..","src","index.js"));

global.QUnit = require("qunitjs");

require("../tests/qunit.config.js");
require("../tests/tests.js");

QUnit.start();
