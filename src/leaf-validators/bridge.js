const v = require('validator');
const { variants$ } = require('../util/variants');
const Info = require('../util/info');

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

class Bridge extends Info {
  constructor(name, errorFunc, firstArgDescriptor, ...otherArgDescriptors) {
    super(name, ...[firstArgDescriptor, ...otherArgDescriptors]);
    this.errorFunc = errorFunc;
  }

  // eslint-disable-next-line class-methods-use-this
  isSpecializedFor(value) { // eslint-disable-line no-unused-vars
    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  cast(value) {
    return value;
  }

  genericError(path, vArgs) {
    if (this.is$) {
      return this.error(`the value at path '${path}' must be a '${this.originalArg0Desc.type.name}' ${vArgs ? this.errorFunc(vArgs) : ''}`);
    }
    return this.error(`the first argument must be a '${this.argDescriptors[0].type.name}' ${vArgs ? this.errorFunc(vArgs) : ''}`);
  }

  link() {
    const original = v[this.baseName];
    const specialized = SPECIALIZED_VALIDATORS[this.baseName];
    return (arg, ...restArgs) => {
      const aArg = this.argDescriptors[0];
      const aExpr = aArg.compile(arg);
      const restExpr = this.compileRestParams(restArgs, 1);
      const restValue = [];
      return (scope) => {
        if (!aExpr.resolved) {
          if (aArg.resolve(aExpr, scope).error) { return this.error(aExpr.error); }
        }
        const errorAt = this.resolveRestParams(restExpr, 1, scope);
        if (errorAt >= 0) { return this.error(restExpr[errorAt].error); }
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
        return result ? undefined : this.genericError(arg, restArgs);
      };
    };
  }
}

class StringOnly extends Bridge {
  constructor(name, errorFunc, ...argDescriptors) {
    super(name, errorFunc, 'value:string', ...argDescriptors);
  }
}

class StringOrNumber extends Bridge {
  constructor(name, errorFunc, ...argDescriptors) {
    super(name, errorFunc, 'value:string|number', ...argDescriptors);
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

class StringOrArray extends Bridge {
  constructor(name, length, type, errorFunc, ...argDescriptors) {
    super(name, errorFunc, 'value:string|array', ...argDescriptors);
    this.length = length;
    this.type = type;
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
    ...variants$(StringOnly, 'contains', args => `containing the value '${args[0]}'`, 'seed:string'),
    // ...variants$(StringOnly, 'equals', args => `equal to the value '${args[0]}'`),
    // ...variants$(StringOnly, 'isAfter', args => `equal to the value '${args[0]}'`),
    ...variants$(StringOnly, 'isAlpha', args => 'containing only letters (a-zA-Z)', 'locale:string?'),
    ...variants$(StringOnly, 'isAlphanumeric', args => 'containing only letters and numbers', 'locale:string?'),
    ...variants$(StringOnly, 'isAscii', args => 'containing ASCII chars only'),
    ...variants$(StringOnly, 'isBase64', args => 'base64 encoded'),
    // ...variants$(StringOnly, 'isBefore', args => `equal to the value '${args[0]}'`),
    // ...variants$(StringOnly, 'isBoolean', args => `equal to the value '${args[0]}'`),
    ...variants$(StringOnly, 'isByteLength', args => 'whose length (in UTF-8 bytes) falls in the specified range', 'options:object?'),
    ...variants$(StringOnly, 'isCreditCard', args => 'representing a credit card'),
    ...variants$(StringOnly, 'isCurrency', args => 'representing a valid currency amount', 'options:object?'),
    ...variants$(StringOnly, 'isDataURI', args => 'in data uri format'),
    // ...variants$(StringOnly, 'isDecimal', args => `equal to the value '${args[0]}'`),
    ...variants$(StringOrNumber, 'isDivisibleBy', args => `that's divisible by ${args[0]}`, 'divisor:integer'),
    ...variants$(StringOnly, 'isEmail', args => 'representing an email address', 'options:object?'),
    ...variants$(StringOnly, 'isEmpty', args => 'having a length of zero', 'options:object?'),
    ...variants$(StringOrNumber, 'isFloat', args => 'that\'s a float falling in the specified range', 'options:object?'),
    ...variants$(StringOnly, 'isFQDN', args => 'representing a fully qualified domain name (e.g. domain.com)', 'options:object?'),
    ...variants$(StringOnly, 'isFullWidth', args => 'containing any full-width chars'),
    ...variants$(StringOnly, 'isHalfWidth', args => 'containing any half-width chars'),
    ...variants$(StringOnly, 'isHash', args => `matching to the format of the hash algorithm ${args[0]}`, 'algorithm:string?'),
    ...variants$(StringOnly, 'isHexadecimal', args => 'representing a hexadecimal number'),
    ...variants$(StringOnly, 'isHexColor', args => 'matching to a hexadecimal color'),
    ...variants$(StringOnly, 'isIdentityCard', args => 'matching to a valid identity card code', 'locale:string?'),
    // ...variants$(StringOnly, 'isIn', args => `equal to the value '${args[0]}'`),
    ...variants$(StringOrNumber, 'isInt', args => 'that\'s an integer falling in the specified range', 'options:object?'),
    ...variants$(StringOnly, 'isIP', args => 'matching to an IP', 'version:integer?'),
    ...variants$(StringOnly, 'isIPRange', args => 'matching to an IP Range'),
    ...variants$(StringOnly, 'isISBN', args => 'matching to an ISBN', 'version:integer?'),
    ...variants$(StringOnly, 'isISIN', args => 'matching to an ISIN'),
    ...variants$(StringOnly, 'isISO31661Alpha2', args => 'matching to a valid ISO 3166-1 alpha-2 officially assigned country code'),
    ...variants$(StringOnly, 'isISO31661Alpha3', args => 'matching to a valid ISO 3166-1 alpha-3 officially assigned country code'),
    ...variants$(StringOnly, 'isISO8601', args => 'matching to a valid ISO 8601 date'),
    ...variants$(StringOnly, 'isISRC', args => 'matching to an ISRC'),
    ...variants$(StringOnly, 'isISSN', args => 'matching to an ISSN', 'options:object?'),
    ...variants$(StringOnly, 'isJSON', args => 'matching to a valid JSON'),
    ...variants$(StringOnly, 'isJWT', args => 'matching to a valid JWT token'),
    ...variants$(StringOrArray, 'isLatLong', 2, 'number', args => "representing a valid latitude-longitude coordinate in the format 'lat,long' or 'lat, long'"),
    // ...variants$(StringOnly, 'isLength', args => 'whose length falls in the specified range'),
    ...variants$(StringOnly, 'isLowercase', args => 'in lowercase'),
    ...variants$(StringOnly, 'isMACAddress', args => 'in MAC address format'),
    ...variants$(StringOnly, 'isMagnetURI', args => 'in magnet uri format'),
    ...variants$(StringOnly, 'isMD5', args => 'representing a valid MD5 hash'),
    ...variants$(StringOnly, 'isMimeType', args => 'matching to a valid MIME type format'),
    ...variants$(StringOnly, 'isMobilePhone', args => 'representing a mobile phone number', 'locale:string|array?', 'options:object?'),
    ...variants$(StringOnly, 'isMongoId', args => 'in the form of a valid hex-encoded representation of a MongoDB ObjectId.'),
    ...variants$(StringOnly, 'isMultibyte', args => 'containing one or more multibyte chars'),
    ...variants$(StringOnly, 'isNumeric', args => 'containing only numbers', 'options:object?'),
    ...variants$(StringOrNumber, 'isPort', args => 'representing a valid port'),
    ...variants$(StringOnly, 'isPostalCode', args => 'representing a postal code', 'options:object'),
    ...variants$(StringOnly, 'isRFC3339', args => 'matching to a valid RFC 3339 date'),
    ...variants$(StringOnly, 'isSurrogatePair', args => 'containing any surrogate pairs chars'),
    ...variants$(StringOnly, 'isUppercase', args => 'in uppercase'),
    ...variants$(StringOnly, 'isURL', args => 'representing a valid URL', 'options:object?'),
    ...variants$(StringOnly, 'isUUID', args => 'matching to a UUID (version 3, 4 or 5)', 'version:integer?'),
    ...variants$(StringOnly, 'isVariableWidth', args => 'containing a mixture of full and half-width chars'),
    ...variants$(StringOnly, 'isWhitelisted', args => 'whose characters belongs to the whitelist', 'chars:string'),
    ...variants$(StringOnly, 'matches', args => `matching the regex '${args[0]}'`, 'pattern:string|regex', 'modifiers:string?')
  ];
  /* eslint-enable no-unused-vars */

  vInfo.forEach((info) => {
    const k = info.name;
    // 1. Make sure not to overwrite any function already defined in the target
    // 2. The value from the validator module must be a function (this prevents errors
    //    due to changes in new versions of the module)
    if (!(k in target) && typeof v[info.baseName] === 'function') {
      target[k] = info.validator; // eslint-disable-line no-param-reassign
    }
  });
  return target;
}

module.exports = bridge;
