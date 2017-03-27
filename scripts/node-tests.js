#!/usr/bin/env node

"use strict";

var path = require("path");

var StableTimers = require( "stable-timers" );
StableTimers.replaceGlobals();

global.$DOM = require(path.join("..","src","index.js"));

global.QUnit = require("qunitjs");

require("../tests/qunit.config.js");
require("../tests/tests.js");

QUnit.start();
