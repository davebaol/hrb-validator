const v = require('validator');
const { get } = require('../util/path');
const ensureArg = require('../util/ensure-arg');

const { REF } = ensureArg;

class Bridge {
  constructor(name, errorFunc, ...argDescriptors) {
    this.name = name;
    this.errorFunc = errorFunc;
    this.argDescriptors = argDescriptors.map((d) => {
      const p = d.trim().split(':'); // argName:type? where '?' means optional
      const argName = p[0].trim();
      const optional = p[1].endsWith('?');
      const type = (optional ? p[1].substring(0, p[1].length - 1) : p[1]).trim();
      return {
        stringDesc: d, name: argName, type, optional
      };
    });
  }

  /* eslint-disable-next-line class-methods-use-this */
  bridge() {
    throw new Error('Inherited classes have to implement the method brige!');
  }

  validator() {
    const bridged = this.bridge();
    bridged.owner = this;
    return bridged;
  }
}

// These funcions are optimizations specialized for certain types.
// Their use avoids the conversion to and from string.
const SPECIALIZED_VALIDATORS = {
  isDivisibleBy(value, number) {
    return value % number === 0;
  },
  isFloat(value, options) {
    const opt = options || {};
    return (opt.min === undefined || value >= opt.min)
      && (opt.max === undefined || value <= opt.max)
      && (opt.lt === undefined || value < opt.lt)
      && (opt.gt === undefined || value > opt.gt);
  },
  isInt(value, options) {
    const opt = options || {};
    return Number.isInteger(value)
      && (opt.min === undefined || value >= opt.min)
      && (opt.max === undefined || value <= opt.max)
      && (opt.lt === undefined || value < opt.lt)
      && (opt.gt === undefined || value > opt.gt);
  },
  isLatLong(value) {
    return value[0] >= -90 && value[0] <= 90 && value[1] >= -180 && value[1] <= 180;
  },
  isPort(value) {
    return Number.isInteger(value) && value >= 0 && value <= 65535;
  }
};

class StringOnly extends Bridge {
  // eslint-disable-next-line class-methods-use-this
  isSpecialized(value) { // eslint-disable-line no-unused-vars
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  cast(value) {
    return value;
  }

  error(path, vArgs) {
    return `${this.name}: the value at path '${path}' must be a string ${vArgs ? this.errorFunc(vArgs) : ''}`;
  }

  ensuredArgs(args) {
    let result = args; // The original array is returned by default
    for (let i = 0; i < result.length; i += 1) {
      const arg = result[i];
      const ad = this.argDescriptors[i];
      if (arg != null || !ad.optional) { // don't ensure a void argument if it's optional
        const ea = ensureArg[ad.type](args[i], ad.name);
        if (ea !== arg) {
          if (result === args) {
            // Lazy shallow copy of the original array is made only when we know
            // for sure that at least one item has to be replaced for some reason.
            // From here on we can safely update items into the copied array, which
            // of course is the one that will be returned.
            result = Array.from(args);
          }
          result[i] = ea;
        }
      }
    }
    return result;
  }

  bridge() {
    const original = v[this.name];
    const specialized = SPECIALIZED_VALIDATORS[this.name];
    return (path, ...args) => {
      let p = ensureArg.path(path);
      const ensuredArgs = this.ensuredArgs(args);
      return (obj) => {
        if (p === REF) {
          try { p = ensureArg.pathRef(obj, path); } catch (e) { return e.message; }
        }
        for (let i = 0, len = this.argDescriptors; i < len; i += 1) {
          if (ensuredArgs[i] === REF) {
            const ad = this.argDescriptors[i];
            try { ensuredArgs[i] = ensureArg[`${ad.type}Ref`](obj, args[i]); } catch (e) { return e.message; }
          }
        }
        let value = get(obj, p);
        let result;
        if (specialized !== undefined && this.isSpecialized(value)) {
          result = specialized(value, ...ensuredArgs);
        } else {
          value = this.cast(value);
          if (typeof value === 'string') {
            result = original(value, ...ensuredArgs);
          } else {
            return this.error(path);
          }
        }
        return result ? undefined : this.error(path, args);
      };
    };
  }
}

class StringAndNumber extends StringOnly {
  // eslint-disable-next-line class-methods-use-this
  isSpecialized(value) {
    return typeof value === 'number';
  }

  // eslint-disable-next-line class-methods-use-this
  cast(value) {
    return typeof value === 'number' ? String(value) : value;
  }

  error(path, vArgs) {
    return `${this.name}: the value at path '${path}' must be either a string or a number ${vArgs ? this.errorFunc(vArgs) : ''}`;
  }
}

class StringAndArray extends StringOnly {
  constructor(name, length, type, errorFunc, ...argDescriptors) {
    super(name, errorFunc, ...argDescriptors);
    this.length = length;
    this.type = type;
  }

  isSpecialized(value) {
    return Array.isArray(value)
      && (this.length === undefined || value.length === this.length)
      // eslint-disable-next-line valid-typeof
      && (this.type === undefined || value.every(a => typeof a === this.type));
  }

  // eslint-disable-next-line class-methods-use-this
  cast(value) {
    return Array.isArray(value) ? value.join(',') : value;
  }

  error(path, vArgs) {
    return `${this.name}: the value at path '${path}' must be either a string or an array ${vArgs ? this.errorFunc(vArgs) : ''}`;
  }
}

/* eslint-disable no-unused-vars */
/* istanbul ignore next */
const vInfo = [
  new StringOnly('contains', args => `containing the value '${args[0]}'`, 'seed:string'),
  // new StringOnly('equals', args => `equal to the value '${args[0]}'`),
  // new StringOnly('isAfter', args => `equal to the value '${args[0]}'`),
  new StringOnly('isAlpha', args => 'containing only letters (a-zA-Z)', 'locale:string?'),
  new StringOnly('isAlphanumeric', args => 'containing only letters and numbers', 'locale:string?'),
  new StringOnly('isAscii', args => 'containing ASCII chars only'),
  new StringOnly('isBase64', args => 'base64 encoded'),
  // new StringOnly('isBefore', args => `equal to the value '${args[0]}'`),
  // new StringOnly('isBoolean', args => `equal to the value '${args[0]}'`),
  new StringOnly('isByteLength', args => 'whose length (in UTF-8 bytes) falls in the specified range', 'options:object?'),
  new StringOnly('isCreditCard', args => 'representing a credit card'),
  new StringOnly('isCurrency', args => 'representing a valid currency amount', 'options:object?'),
  new StringOnly('isDataURI', args => 'in data uri format'),
  // new StringOnly('isDecimal', args => `equal to the value '${args[0]}'`),
  new StringAndNumber('isDivisibleBy', args => `that's divisible by ${args[0]}`, 'divisor:integer'),
  new StringOnly('isEmail', args => 'representing an email address', 'options:object?'),
  new StringOnly('isEmpty', args => 'having a length of zero', 'options:object?'),
  new StringAndNumber('isFloat', args => 'that\'s a float falling in the specified range', 'options:object?'),
  new StringOnly('isFQDN', args => 'representing a fully qualified domain name (e.g. domain.com)', 'options:object?'),
  new StringOnly('isFullWidth', args => 'containing any full-width chars'),
  new StringOnly('isHalfWidth', args => 'containing any half-width chars'),
  new StringOnly('isHash', args => `matching to the format of the hash algorithm ${args[0]}`, 'algorithm:string?'),
  new StringOnly('isHexadecimal', args => 'representing a hexadecimal number'),
  new StringOnly('isHexColor', args => 'matching to a hexadecimal color'),
  new StringOnly('isIdentityCard', args => 'matching to a valid identity card code', 'locale:string?'),
  // new StringOnly('isIn', args => `equal to the value '${args[0]}'`),
  new StringAndNumber('isInt', args => 'that\'s an integer falling in the specified range', 'options:object?'),
  new StringOnly('isIP', args => 'matching to an IP', 'version:integer?'),
  new StringOnly('isIPRange', args => 'matching to an IP Range'),
  new StringOnly('isISBN', args => 'matching to an ISBN', 'version:integer?'),
  new StringOnly('isISIN', args => 'matching to an ISIN'),
  new StringOnly('isISO31661Alpha2', args => 'matching to a valid ISO 3166-1 alpha-2 officially assigned country code'),
  new StringOnly('isISO31661Alpha3', args => 'matching to a valid ISO 3166-1 alpha-3 officially assigned country code'),
  new StringOnly('isISO8601', args => 'matching to a valid ISO 8601 date'),
  new StringOnly('isISRC', args => 'matching to an ISRC'),
  new StringOnly('isISSN', args => 'matching to an ISSN', 'options:object?'),
  new StringOnly('isJSON', args => 'matching to a valid JSON'),
  new StringOnly('isJWT', args => 'matching to a valid JWT token'),
  new StringAndArray('isLatLong', 2, 'number', args => "representing a valid latitude-longitude coordinate in the format 'lat,long' or 'lat, long'"),
  // new StringOnly('isLength', args => 'whose length falls in the specified range'),
  new StringOnly('isLowercase', args => 'in lowercase'),
  new StringOnly('isMACAddress', args => 'in MAC address format'),
  new StringOnly('isMagnetURI', args => 'in magnet uri format'),
  new StringOnly('isMD5', args => 'representing a valid MD5 hash'),
  new StringOnly('isMimeType', args => 'matching to a valid MIME type format'),
  new StringOnly('isMobilePhone', args => 'representing a mobile phone number', 'locale:stringOrArray?', 'options:object?'),
  new StringOnly('isMongoId', args => 'in the form of a valid hex-encoded representation of a MongoDB ObjectId.'),
  new StringOnly('isMultibyte', args => 'containing one or more multibyte chars'),
  new StringOnly('isNumeric', args => 'containing only numbers', 'options:object?'),
  new StringAndNumber('isPort', args => 'representing a valid port'),
  new StringOnly('isPostalCode', args => 'representing a postal code', 'options:object'),
  new StringOnly('isRFC3339', args => 'matching to a valid RFC 3339 date'),
  new StringOnly('isSurrogatePair', args => 'containing any surrogate pairs chars'),
  new StringOnly('isUppercase', args => 'in uppercase'),
  new StringOnly('isURL', args => 'representing a valid URL', 'options:object?'),
  new StringOnly('isUUID', args => 'matching to a UUID (version 3, 4 or 5)', 'version:integer?'),
  new StringOnly('isVariableWidth', args => 'containing a mixture of full and half-width chars'),
  new StringOnly('isWhitelisted', args => 'whose characters belongs to the whitelist', 'chars:string'),
  new StringOnly('matches', args => `matching the regex '${args[0]}'`, 'pattern:stringOrRegex', 'modifiers:string?')
];
/* eslint-enable no-unused-vars */

function bridge(target) {
  vInfo.forEach((b) => {
    const k = b.name;
    // 1. Make sure not to overwrite any function already defined in the target
    // 2. The value from the validator module must be a function (this prevents errors
    //    due to changes in new versions of the module)
    if (!(k in target) && typeof v[k] === 'function') {
      target[k] = b.validator(); // eslint-disable-line no-param-reassign
    }
  });
  return target;
}

module.exports = bridge;
