/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const { Scope, compile } = require("../lib");

let toBeValidated = {
    a: {
        b: 1,
        c: true,
        d: ["foo", "bar"]
    }
};

// Load validator from file
let vObj = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "data-driven.yaml"), 'utf8'));
let validator = compile(vObj);

// Validate
let vError = validator(new Scope(toBeValidated));

console.log(`${path.basename(__filename)}: Validation result --> ${vError? vError : "OK!"}`);