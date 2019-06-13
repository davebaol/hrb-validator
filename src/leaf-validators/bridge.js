const v = require('validator');
const { optInfoVariant } = require('../util/variants');
const Info = require('../util/info');

class Bridge extends Info {
  constructor(name, errorFunc, ...argDescriptors) {
    super(name, ...argDescriptors);
    this.errorFunc = errorFunc;
  }
}

const EMPTY_OBJ = Object.freeze({});

// These functions are optimizations specialized for certain types.
// Their use avoids the conversion to and from string.
const SPECIALIZED_VALIDATORS = {
  isDivisibleBy(value, number) {
    return value % number === 0;
  },
  isFloat(value, options = EMPTY_OBJ) {
    return (options.min === undefined || value >= options.min)
      && (options.max === undefined || value <= options.max)
      && (options.lt === undefined || value < options.lt)
      && (options.gt === undefined || value > options.gt);
  },
  isInt(value, options = EMPTY_OBJ) {
    return Number.isInteger(value)
      && (options.min === undefined || value >= options.min)
      && (options.max === undefined || value <= options.max)
      && (options.lt === undefined || value < options.lt)
      && (options.gt === undefined || value > options.gt);
  },
  isLatLong(value) {
    return value[0] >= -90 && value[0] <= 90 && value[1] >= -180 && value[1] <= 180;
  },
  isPort(value) {
    return Number.isInteger(value) && value >= 0 && value <= 65535;
  }
};

class StringOnly extends Bridge {
  static variants(name, errorFunc, ...argDescriptors) {
    const adList = ['value:string', ...argDescriptors];
    return [
      new StringOnly(name, errorFunc, ...adList),
      new StringOnly(`${name}$`, errorFunc, ...adList)
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  isSpecializedFor(value) { // eslint-disable-line no-unused-vars
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  cast(value) {
    return value;
  }

  error(path, vArgs) {
    return `${this.name}: the value at path '${path}' must be a string ${vArgs ? this.errorFunc(vArgs) : ''}`;
  }

  link() {
    const original = v[this.baseName];
    const specialized = SPECIALIZED_VALIDATORS[this.baseName];
    return (arg, ...restArgs) => {
      const aExpr = this.argDescriptors[0].compile(arg);
      const restExpr = this.compileRestParams(restArgs, 1);
      const restValue = [];
      return (scope) => {
        if (!aExpr.resolved) {
          this.argDescriptors[0].resolve(aExpr, scope);
          if (aExpr.error) { return aExpr.error; }
        }
        const errorAt = this.resolveRestParams(restExpr, 1, scope);
        if (errorAt >= 0) { return restExpr[errorAt].error; }
        for (let i = 0, len = restExpr.length; i < len; i += 1) {
          restValue[i] = restExpr[i].result;
        }
        let value = this.getValue(aExpr, scope);
        let result;
        if (specialized !== undefined && this.isSpecializedFor(value)) {
          result = specialized(value, ...restValue);
        } else {
          value = this.cast(value);
          if (typeof value !== 'string') {
            return this.error(arg);
          }
          result = original(value, ...restValue);
        }
        return result ? undefined : this.error(arg, restArgs);
      };
    };
  }
}

class StringOrNumber extends StringOnly {
  static variants(name, errorFunc, ...argDescriptors) {
    const adList = ['value:string|number', ...argDescriptors];
    return [
      new StringOrNumber(name, errorFunc, ...adList),
      new StringOrNumber(`${name}$`, errorFunc, ...adList)
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  isSpecializedFor(value) {
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

class StringOrArray extends StringOnly {
  constructor(name, length, type, errorFunc, ...argDescriptors) {
    super(name, errorFunc, ...argDescriptors);
    this.length = length;
    this.type = type;
  }

  static variants(name, length, type, errorFunc, ...argDescriptors) {
    const adList = ['value:string|array', ...argDescriptors];
    return [
      new StringOrArray(name, length, type, errorFunc, ...adList),
      new StringOrArray(`${name}$`, length, type, errorFunc, ...adList)
    ];
  }

  isSpecializedFor(value) {
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

function bridge(target) {
  /* eslint-disable no-unused-vars */
  /* istanbul ignore next */
  const vInfo = [
    ...StringOnly.variants('contains', args => `containing the value '${args[0]}'`, 'seed:string'),
    // ...StringOnly.variants('equals', args => `equal to the value '${args[0]}'`),
    // ...StringOnly.variants('isAfter', args => `equal to the value '${args[0]}'`),
    ...StringOnly.variants('isAlpha', args => 'containing only letters (a-zA-Z)', 'locale:string?'),
    ...StringOnly.variants('isAlphanumeric', args => 'containing only letters and numbers', 'locale:string?'),
    ...StringOnly.variants('isAscii', args => 'containing ASCII chars only'),
    ...StringOnly.variants('isBase64', args => 'base64 encoded'),
    // ...StringOnly.variants('isBefore', args => `equal to the value '${args[0]}'`),
    // ...StringOnly.variants('isBoolean', args => `equal to the value '${args[0]}'`),
    ...StringOnly.variants('isByteLength', args => 'whose length (in UTF-8 bytes) falls in the specified range', 'options:object?'),
    ...StringOnly.variants('isCreditCard', args => 'representing a credit card'),
    ...StringOnly.variants('isCurrency', args => 'representing a valid currency amount', 'options:object?'),
    ...StringOnly.variants('isDataURI', args => 'in data uri format'),
    // ...StringOnly.variants('isDecimal', args => `equal to the value '${args[0]}'`),
    ...StringOrNumber.variants('isDivisibleBy', args => `that's divisible by ${args[0]}`, 'divisor:integer'),
    ...StringOnly.variants('isEmail', args => 'representing an email address', 'options:object?'),
    ...StringOnly.variants('isEmpty', args => 'having a length of zero', 'options:object?'),
    ...StringOrNumber.variants('isFloat', args => 'that\'s a float falling in the specified range', 'options:object?'),
    ...StringOnly.variants('isFQDN', args => 'representing a fully qualified domain name (e.g. domain.com)', 'options:object?'),
    ...StringOnly.variants('isFullWidth', args => 'containing any full-width chars'),
    ...StringOnly.variants('isHalfWidth', args => 'containing any half-width chars'),
    ...StringOnly.variants('isHash', args => `matching to the format of the hash algorithm ${args[0]}`, 'algorithm:string?'),
    ...StringOnly.variants('isHexadecimal', args => 'representing a hexadecimal number'),
    ...StringOnly.variants('isHexColor', args => 'matching to a hexadecimal color'),
    ...StringOnly.variants('isIdentityCard', args => 'matching to a valid identity card code', 'locale:string?'),
    // ...StringOnly.variants('isIn', args => `equal to the value '${args[0]}'`),
    ...StringOrNumber.variants('isInt', args => 'that\'s an integer falling in the specified range', 'options:object?'),
    ...StringOnly.variants('isIP', args => 'matching to an IP', 'version:integer?'),
    ...StringOnly.variants('isIPRange', args => 'matching to an IP Range'),
    ...StringOnly.variants('isISBN', args => 'matching to an ISBN', 'version:integer?'),
    ...StringOnly.variants('isISIN', args => 'matching to an ISIN'),
    ...StringOnly.variants('isISO31661Alpha2', args => 'matching to a valid ISO 3166-1 alpha-2 officially assigned country code'),
    ...StringOnly.variants('isISO31661Alpha3', args => 'matching to a valid ISO 3166-1 alpha-3 officially assigned country code'),
    ...StringOnly.variants('isISO8601', args => 'matching to a valid ISO 8601 date'),
    ...StringOnly.variants('isISRC', args => 'matching to an ISRC'),
    ...StringOnly.variants('isISSN', args => 'matching to an ISSN', 'options:object?'),
    ...StringOnly.variants('isJSON', args => 'matching to a valid JSON'),
    ...StringOnly.variants('isJWT', args => 'matching to a valid JWT token'),
    ...StringOrArray.variants('isLatLong', 2, 'number', args => "representing a valid latitude-longitude coordinate in the format 'lat,long' or 'lat, long'"),
    // ...StringOnly.variants('isLength', args => 'whose length falls in the specified range'),
    ...StringOnly.variants('isLowercase', args => 'in lowercase'),
    ...StringOnly.variants('isMACAddress', args => 'in MAC address format'),
    ...StringOnly.variants('isMagnetURI', args => 'in magnet uri format'),
    ...StringOnly.variants('isMD5', args => 'representing a valid MD5 hash'),
    ...StringOnly.variants('isMimeType', args => 'matching to a valid MIME type format'),
    ...StringOnly.variants('isMobilePhone', args => 'representing a mobile phone number', 'locale:string|array?', 'options:object?'),
    ...StringOnly.variants('isMongoId', args => 'in the form of a valid hex-encoded representation of a MongoDB ObjectId.'),
    ...StringOnly.variants('isMultibyte', args => 'containing one or more multibyte chars'),
    ...StringOnly.variants('isNumeric', args => 'containing only numbers', 'options:object?'),
    ...StringOrNumber.variants('isPort', args => 'representing a valid port'),
    ...StringOnly.variants('isPostalCode', args => 'representing a postal code', 'options:object'),
    ...StringOnly.variants('isRFC3339', args => 'matching to a valid RFC 3339 date'),
    ...StringOnly.variants('isSurrogatePair', args => 'containing any surrogate pairs chars'),
    ...StringOnly.variants('isUppercase', args => 'in uppercase'),
    ...StringOnly.variants('isURL', args => 'representing a valid URL', 'options:object?'),
    ...StringOnly.variants('isUUID', args => 'matching to a UUID (version 3, 4 or 5)', 'version:integer?'),
    ...StringOnly.variants('isVariableWidth', args => 'containing a mixture of full and half-width chars'),
    ...StringOnly.variants('isWhitelisted', args => 'whose characters belongs to the whitelist', 'chars:string'),
    ...StringOnly.variants('matches', args => `matching the regex '${args[0]}'`, 'pattern:string|regex', 'modifiers:string?')
  ];
  /* eslint-enable no-unused-vars */

  vInfo.forEach((info) => {
    info.consolidate();
    const k = info.name;
    // 1. Make sure not to overwrite any function already defined in the target
    // 2. The value from the validator module must be a function (this prevents errors
    //    due to changes in new versions of the module)
    if (!(k in target) && typeof v[info.baseName] === 'function') {
      target[k] = info.validator; // eslint-disable-line no-param-reassign

      // Add opt variant
      const optInfo = optInfoVariant(info.validator);
      target[optInfo.name] = optInfo.validator; // eslint-disable-line no-param-reassign
    }
  });
  return target;
}

module.exports = bridge;
