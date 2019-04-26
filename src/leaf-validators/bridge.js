const v = require('validator');
const { get, ensureArrayPath } = require('../util/path');

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
  isByteLength: args => 'whose length (in UTF-8 bytes) falls in the specified range',
  isCreditCard: args => 'representing a credit card',
  isCurrency: args => 'representing a valid currency amount',
  isDataURI: args => 'in data uri format',
  // isDecimal: args => `equal to the value '${args[0]}'`,
  isDivisibleBy: args => `that's divisible by ${args[0]}`,
  isEmail: args => 'representing an email address',
  // isEmpty: args => `equal to the value '${args[0]}'`,
  isFloat: args => 'that\'s a float falling in the specified range',
  isFQDN: args => 'representing a fully qualified domain name (e.g. domain.com)',
  isFullWidth: args => 'containing any full-width chars',
  isHalfWidth: args => 'containing any half-width chars',
  isHash: args => `matching to the format of the hash algorithm ${args[0]}`,
  // isHexadecimal: args => `equal to the value '${args[0]}'`,
  isHexColor: args => 'matching to a hexadecimal color',
  isIdentityCard: args => 'matching to a valid identity card code',
  // isIn: args => `equal to the value '${args[0]}'`,
  isInt: args => 'that\'s an integer falling in the specified range',
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
  // isLength: args => 'whose length falls in the specified range',
  isLowercase: args => 'in lowercase',
  isMACAddress: args => 'in MAC address format',
  isMagnetURI: args => 'in magnet uri format',
  isMD5: args => 'representing a valid MD5 hash',
  isMimeType: args => 'matching to a valid MIME type format',
  isMobilePhone: args => 'representing a mobile phone number',
  isMongoId: args => 'in the form of a valid hex-encoded representation of a MongoDB ObjectId.',
  isMultibyte: args => 'containing one or more multibyte chars',
  isNumeric: args => 'containing only numbers',
  isPort: args => 'representing a valid port',
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

class StringOnly {
  static error(vName, path, vArgs) {
    return `${vName}: the value at path '${path}' must be a string ${vName ? vInfo[vName](vArgs) : ''}`;
  }

  static validator(vName) {
    return (path, ...args) => {
      const p = ensureArrayPath(path);
      return (obj) => {
        const value = get(obj, p);
        if (typeof value !== 'string') {
          return this.error(null, path);
        }
        return v[vName](value, ...args) ? undefined : this.error(vName, path, args);
      };
    };
  }
}

class StringAndNumber {
  static error(vName, path, vArgs) {
    return `${vName}: the value at path '${path}' must be either a string or a number ${vName ? vInfo[vName](vArgs) : ''}`;
  }

  static validator(vName) {
    return (path, ...args) => {
      const p = ensureArrayPath(path);
      return (obj) => {
        let value = get(obj, p);
        const valueType = typeof value;
        if (valueType === 'number') {
          value = String(value);
        } else if (valueType !== 'string') {
          return this.error(null, path);
        }
        return v[vName](value, ...args) ? undefined : this.error(vName, path, args);
      };
    };
  }
}

const acceptStringAndNumber = ['isDivisibleBy', 'isFloat', 'isInt', 'isPort'].reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {});

function bridge(target) {
  return Object.keys(vInfo).reduce((acc, k) => {
    // 1. Make sure not to overwrite any function already defined in the target
    // 2. The value from the validator module must be a function (this prevents errors
    //    due to changes in new versions of the module)
    if (!(k in acc) && typeof v[k] === 'function') {
      acc[k] = (acceptStringAndNumber[k] ? StringAndNumber : StringOnly).validator(k);
    }
    return acc;
  }, target);
}

module.exports = bridge;
