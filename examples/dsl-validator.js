/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const ensureValidator = require("../lib/ensure-validator");

// Load DSL validator from file
let dslValidator = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "dsl-validator.yaml"), 'utf8'));
let validator = ensureValidator(dslValidator);

// Validate the DSL validator itself
let toBeValidated = yaml.safeLoad(fs.readFileSync(path.join(__dirname, "dsl-validator.yaml"), 'utf8'));
let vError = validator(toBeValidated);

console.log(`${path.basename(__filename)}: Validation result --> ${vError? vError : "OK!"}`);