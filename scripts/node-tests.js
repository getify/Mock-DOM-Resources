#!/usr/bin/env node

"use strict";

var path = require("path");

global.$DOM = require(path.join("..","src","index.js"));

global.QUnit = require("qunitjs");

require("../tests/qunit.config.js");
require("../tests/tests.js");

QUnit.start();
