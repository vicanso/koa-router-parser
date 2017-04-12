'use strict';

const KoaRouter = require('koa-router');

const routerHandlers = {};
const defaultMiddlewares = {};

function isString(value) {
  return typeof value === 'string';
}

function isFunction(value) {
  return typeof value === 'function';
}

function isObject(value) {
  const type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
}

function convertMethods(str) {
  const arr = Array.isArray(str) ? str : str.split(',');
  return arr.map(method => method.trim().toLowerCase());
}

function convertUrls(str) {
  const arr = Array.isArray(str) ? str : str.split(',');
  return arr.map(item => item.trim());
}

function convertHandlers(str) {
  if (isFunction(str)) {
    return [str];
  }
  const arr = Array.isArray(str) ? str : str.split('&');
  return arr.map((item) => {
    if (isString(item)) {
      return item.trim();
    }
    return item;
  });
}

function cut(str) {
  if (!isString(str)) {
    return str;
  }
  let tmp = str.trim();
  if (tmp.charAt(0) === '[') {
    tmp = tmp.substring(1);
  }
  if (tmp.charAt(tmp.length - 1) === ']') {
    tmp = tmp.substring(0, tmp.length - 1);
  }
  return tmp;
}

/**
 * [covert description]
 * @param  {[type]}  str   [description]
 * @return {[type]}        [description]
 */
function covert(str) {
  if (!str) {
    throw new Error('desc can not be null');
  }
  if (Array.isArray(str)) {
    const descArr = str;
    if (descArr.length !== 3) {
      throw new Error(`${descArr.join(' ')} is invalid`);
    }
    return {
      methods: convertMethods(cut(descArr[0])),
      urls: convertUrls(cut(descArr[1])),
      handlers: convertHandlers(cut(descArr[2])),
    };
  }
  if (!Array.isArray(str) && isObject(str)) {
    const item = str;
    return {
      methods: convertMethods(item.methods),
      urls: convertUrls(item.urls),
      handlers: convertHandlers(item.handlers),
    };
  }
  const reg = /\]\s+\[/g;
  const arr = str.split(reg);
  if (arr.length !== 3) {
    throw new Error(`${str} is invalid`);
  }
  return {
    methods: convertMethods(cut(arr[0])),
    urls: convertUrls(cut(arr[1])),
    handlers: convertHandlers(cut(arr[2])),
  };
}

function getArgs(str) {
  const params = str.substring(1, str.length - 1);
  return JSON.parse(`[${params}]`);
}

/**
 * [get description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
function get(name) {
  if (isFunction(name)) {
    return name;
  }
  if (routerHandlers[name]) {
    return routerHandlers[name];
  }
  const reg = /(\S+)(\([\s\S]+\))$/;
  const result = reg.exec(name);
  // fn(1,2)
  if (!result || !result[1] || !result[2]) {
    return null;
  }
  const fn = routerHandlers[result[1]];
  if (!fn) {
    return null;
  }
  const args = getArgs(result[2]);
  /* eslint prefer-spread:0 */
  return fn.apply(null, args);
}

/**
 * [parse description]
 * @param  {[type]} desc [description]
 * @return {[type]}     [description]
 */
function parse(desc) {
  const router = new KoaRouter();
  const descList = Array.isArray(desc) ? desc : [desc];
  descList.forEach((item) => {
    const options = covert(item);
    const arr = [];
    options.handlers.forEach((name) => {
      const fn = get(name);
      /* istanbul ignore else */
      if (fn) {
        arr.push(fn);
      } else {
        throw new Error(`${name} is not found`);
      }
    });
    options.methods.forEach((method) => {
      options.urls.forEach((url) => {
        const tmpArr = (defaultMiddlewares.common || [])
          .concat(defaultMiddlewares[method] || [])
          .concat(arr);
        tmpArr.unshift(url);
        router[method].apply(router, tmpArr);
      });
    });
  });

  return router;
}

/**
 * [add description]
 * @param {[type]} name    [description]
 * @param {[type]} handler [description]
 */
function add(name, handler) {
  /* istanbul ignore if */
  if (!name || !isFunction(handler)) {
    throw new Error('name cant not be null and handler must be a function');
  }
  routerHandlers[name] = handler;
}

/**
 * [remove description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
function remove(name) {
  const fn = routerHandlers[name];
  delete routerHandlers[name];
  return fn;
}

/**
 * [addDefault description]
 * @param {[type]} type       [description]
 * @param {[type]} middleware [description]
 */
function addDefault(type, middleware) {
  /* istanbul ignore if */
  if (!type || !isFunction(middleware)) {
    throw new Error('type cant not be null and middleware must be a function');
  }
  /* istanbul ignore else */
  if (!defaultMiddlewares[type]) {
    defaultMiddlewares[type] = [];
  }
  const arr = defaultMiddlewares[type];
  /* istanbul ignore else */
  if (arr.indexOf(middleware) === -1) {
    arr.push(middleware);
  }
}

function removeDefault(type, middleware) {
  /* istanbul ignore if */
  if (!type) {
    throw new Error('type cant not be null and middleware must be a function');
  }
  const arr = defaultMiddlewares[type];
  if (!arr || !arr.length) {
    return;
  }
  if (!middleware) {
    arr.length = 0;
    return;
  }
  const index = arr.indexOf(middleware);
  arr.splice(index, 1);
}

exports.parse = parse;
exports.add = add;
exports.get = get;
exports.remove = remove;
exports.addDefault = addDefault;
exports.removeDefault = removeDefault;
