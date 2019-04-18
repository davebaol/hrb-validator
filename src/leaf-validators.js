const camelCase = require('camelcase');
const v = require('validator');
const { get } = require('./util');

/* eslint-disable no-unused-vars */
const vInfo = {
  contains: args => `containing the value '${args[0]}'`,
  // equals: args => `equal to the value '${args[0]}'`,
  // isAfter: args => `equal to the value '${args[0]}'`,
  isAlpha: args => 'containing only letters (a-zA-Z)',
  isAlphanumeric: args => 'containing only letters and numbers',
  isAscii: args => 'containing ASCII chars only',
  isBase64: args => 'base64 encoded',
  // isBefore: args => `equal to the value '${args[0]}'`,
  // isBoolean: args => `equal to the value '${args[0]}'`,
  // isByteLength: args => `equal to the value '${args[0]}'`,
  isCreditCard: args => 'representing a credit card',
  isCurrency: args => 'representing a valid currency amount',
  isDataURI: args => 'in data uri format',
  // isDecimal: args => `equal to the value '${args[0]}'`,
  // isDivisibleBy: args => `equal to the value '${args[0]}'`,
  isEmail: args => 'representing an email address',
  // isEmpty: args => `equal to the value '${args[0]}'`,
  // isFloat: args => `equal to the value '${args[0]}'`,
  isFQDN: args => 'representing a fully qualified domain name (e.g. domain.com)',
  isFullWidth: args => 'containing any full-width chars',
  isHalfWidth: args => 'containing any half-width chars',
  isHash: args => `matching to the format of the hash algorithm ${args[0]}`,
  // isHexadecimal: args => `equal to the value '${args[0]}'`,
  isHexColor: args => 'matching to a hexadecimal color',
  isIdentityCard: args => 'matching to a valid identity card code',
  // isIn: args => `equal to the value '${args[0]}'`,
  // isInt: args => `equal to the value '${args[0]}'`,
  isIP: args => 'matching to an IP',
  isIPRange: args => 'matching to an IP Range',
  isISBN: args => 'matching to an ISBN',
  isISIN: args => 'matching to an ISIN',
  isISO31661Alpha2: args => 'matching to a valid ISO 3166-1 alpha-2 officially assigned country code',
  isISO31661Alpha3: args => 'matching to a valid ISO 3166-1 alpha-3 officially assigned country code',
  isISO8601: args => 'matching to a valid ISO 8601 date',
  isISRC: args => 'matching to an ISRC',
  isISSN: args => 'matching to an ISSN',
  isJSON: args => 'matching to a valid JSON',
  isJWT: args => 'matching to a valid JWT token',
  isLatLong: args => "representing a valid latitude-longitude coordinate in the format 'lat,long' or 'lat, long'",
  isLength: args => 'whose length falls in the specified range',
  isLowercase: args => 'in lowercase',
  isMACAddress: args => 'in MAC address format',
  isMagnetURI: args => 'in magnet uri format',
  isMD5: args => 'representing a valid MD5 hash',
  isMimeType: args => 'matching to a valid MIME type format',
  isMobilePhone: args => 'representing a mobile phone number',
  isMongoId: args => 'in the form of a valid hex-encoded representation of a MongoDB ObjectId.',
  isMultibyte: args => 'containing one or more multibyte chars',
  isNumeric: args => 'containing only numbers',
  // isPort: args => `equal to the value '${args[0]}'`,
  isPostalCode: args => 'representing a postal code',
  isRFC3339: args => 'matching to a valid RFC 3339 date',
  isSurrogatePair: args => 'containing any surrogate pairs chars',
  isUppercase: args => 'in uppercase',
  isURL: args => 'representing a valid URL',
  isUUID: args => 'matching to a UUID (version 3, 4 or 5)',
  isVariableWidth: args => 'containing a mixture of full and half-width chars',
  isWhitelisted: args => 'whose characters belongs to the whitelist',
  matches: args => `matching the regex '${args[0]}'`
};
/* eslint-enable no-unused-vars */

function vError(vName, path, vArgs) {
  return `${vName}: the value at path '${path}' must be a string ${vName ? vInfo[vName](vArgs) : ''}`;
}

function vFunc(vName) {
  return (path, ...args) => (obj) => {
    const value = get(obj, path);
    // console.log(value);
    if (typeof value !== 'string') {
      return vError(null, path);
    }
    return v[vName](value, ...args) ? undefined : vError(vName, path, args);
  };
}

const primitiveTypeCheckers = {
  boolean: arg => typeof arg === 'boolean',
  number: arg => typeof arg === 'number',
  string: arg => typeof arg === 'string'
};

const typeCheckers = Object.assign(primitiveTypeCheckers, {
  array: arg => Array.isArray(arg),
  object: arg => typeof arg === 'object' && arg != null && arg.constructor === Object,
  regex: arg => arg instanceof RegExp
});

//
// LEAF VALIDATORS
// They all take path as the first argument
//
const leafValidators = {
  equals(path, value) {
    return obj => (get(obj, path) === value ? undefined : `the value at path '${path}' must be equal to '${value}'`);
  },
  isLE(path, value) {
    return obj => (get(obj, path) <= value ? undefined : `the value at path '${path}' must be less than or equal to '${value}'`);
  },
  isGT(path, value) {
    return obj => (get(obj, path) > value ? undefined : `the value at path '${path}' must be greater than '${value}'`);
  },
  isSet(path) {
    return obj => (get(obj, path) != null ? undefined : `the value at path '${path}' must be set`);
  },
  isNotEmpty(path) {
    return (obj) => {
      const value = get(obj, path);
      if (!value) return `the value at path '${path}' must be set`;
      if (typeof value === 'string' && value.trim().length === 0) return `the value at path '${path}' must have at least a not space char`;
      if (typeof value === 'number' && value === 0) return `the value at path '${path}' must not be zero`;
      return undefined;
    };
  },
  isPort(path, options) {
    const opts = Object.assign({ asNumber: true, asString: true }, options || {});
    if (!opts.asNumber && !opts.asString) {
      throw new Error('Bad validator: inconsistent isPort options: either asNumber or asString must be true');
    }
    return (obj) => {
      let value = get(obj, path);
      if (typeof value === 'number') {
        if (opts.asNumber) {
          value += '';
        } else if (opts.asString) {
          return `the value at path '${path}' must be a string`;
        }
      } else if (typeof value === 'string') {
        if (!opts.asString && opts.asNumber) {
          return `the value at path '${path}' must be a number`;
        }
      } else {
        return `the value at path '${path}' must be either a string or a number`;
      }
      return v.isPort(value) ? undefined : `the value at path '${path}' must be a valid port`;
    };
  },
  isType(path, type) {
    if (typeof type === 'string' && typeCheckers[type]) {
      return obj => (typeCheckers[type](get(obj, path)) ? undefined : `the value at path '${path}' must be a '${type}'`);
    }
    if (Array.isArray(type) && type.every(t => typeof t === 'string' && typeCheckers[t])) {
      return (obj) => {
        const value = get(obj, path);
        return (type.some(t => typeCheckers[t](value)) ? undefined : `the value at path '${path}' must have one of the specified types '${type.join(', ')}'`);
      };
    }
    throw new Error(`isType: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  },
  isOneOf(path, values) {
    return obj => (values.includes(get(obj, path)) ? undefined : `the value at path '${path}' must be one of ${values}`);
  },
  isDate(path) {
    return obj => (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(get(obj, path)) ? undefined : `the value at path '${path}' must be a date in this format YYYY-MM-DD HH:MM:SS`);
  },
  isArrayOf(path, type) {
    if (typeof type === 'string' && typeCheckers[type]) {
      return (obj) => {
        const value = get(obj, path);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be an array`;
        const flag = value.every(e => typeCheckers[type](e));
        return flag ? undefined : `the value at path '${path}' must be a 'array of ${type}'`;
      };
    }
    if (Array.isArray(type) && type.every(t => typeof t === 'string' && typeCheckers[t])) {
      return (obj) => {
        const value = get(obj, path);
        if (!Array.isArray(value)) return `isArrayOf: the value at path '${path}' must be a 'array'`;
        const flag = value.every(e => type.some(t => typeCheckers[t](e)));
        return flag ? undefined : `isArrayOf: the value at path '${path}' must be an array where each item has a type amongst ${Object.keys(type).join(', ')}'`;
      };
    }
    throw new Error(`isArrayOf: the type must be a string or an array of strings amongst ${Object.keys(typeCheckers).join(', ')}`);
  },
};

//
// Augment leaf validators with the ones from validator module
//
Object.keys(vInfo).reduce((acc, k) => {
  // Make sure the function exists in order to prevent errors
  // due to changes in new versions of the validator module
  if (typeof v[k] === 'function') {
    acc[k] = vFunc(k);
  }
  return acc;
}, leafValidators);


//
// Augment leaf validators with shortcuts 'opt' and 'not'
//
const shortcuts = {
  opt(f) {
    return (path, ...args) => obj => (get(obj, path) ? f(path, ...args)(obj) : undefined);
  },
  not(f, k) {
    return (path, ...args) => obj => (f(path, ...args)(obj) ? undefined : `the value at path '${path}' must satisfy the validator '${k}'`);
  }
};

function addShortcuts(obj, key) {
  return Object.keys(shortcuts).reduce((acc, shortcut) => {
    const newKey = camelCase(`${shortcut} ${key}`);
    acc[newKey] = shortcuts[shortcut](obj[key], newKey);
    return acc;
  }, obj);
}

Object.keys(leafValidators).reduce((acc, key) => addShortcuts(acc, key), leafValidators);


module.exports = leafValidators;
