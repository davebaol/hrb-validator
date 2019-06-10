/* eslint-disable no-console */
const path = require("path");
const V = require('../lib');
const Scope = require("../lib/util/scope");

let toBeValidated = {
    a: {
        b: 1,
        c: true,
        d: ["foo", "bar"]
    }
};

// Hard-coded validator
let validator = V.and(                // Rule 1
    V.isType("a", "object"),          //   Rule 2
    V.xor(                            //   Rule 3
        V.isSet("a.b"),
        V.isSet("a.c")
    ),
    V.optIsType("a.b", "number"),     //   Rule 4
    V.optIsType("a.c", "boolean"),    //   Rule 5
    V.isArrayOf("a.d", "string")      //   Rule 6
);


// Validate
let vError = validator(new Scope(toBeValidated));

console.log(`${path.basename(__filename)}: Validation result --> ${vError? vError : "OK!"}`);