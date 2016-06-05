'use strict';
const KoaRouter = require('koa-router');
const util = require('util');
const routerHandlers = {};
const defaultMiddlewares = {};

/**
 * [covert description]
 * @param  {[type]}  str   [description]
 * @return {[type]}        [description]
 */
function covert(str) {
  if (!str) {
    throw new Error('desc can not be null');
  }
  const arr = str.split(' ');
  if (arr.length !== 3) {
    throw new Error('desc is invalid');
  }
  const methods = arr[0].split('|').map(method => method.toLowerCase());

  return {
    methods,
    urls: arr[1].split('|'),
    handlers: arr[2].split('&'),
  };
}

function getArgs(str) {
  const arr = str.substring(1, str.length - 1).split(',');
  return arr.map(v => {
    const value = v.trim();
    let result;
    switch (value.charAt(0)) {
      case "'":
      case '"':
        result = value.substring(1, value.length - 1);
        break;
      case '{':
      case '[':
        result = JSON.parse(value);
        break;
      default:
        result = Number(value);
        break;
    }
    return result;
  });
}

/**
 * [get description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
function get(name) {
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
  return fn.apply(null, args);
}

/**
 * [parse description]
 * @param  {[type]} desc [description]
 * @return {[type]}     [description]
 */
function parse(desc) {
  const router = new KoaRouter();
  const descList = util.isArray(desc) ? desc : [desc];
  descList.forEach(item => {
    const options = covert(item);
    const arr = [];
    options.handlers.forEach(name => {
      const fn = get(name);
      /* istanbul ignore else */
      if (fn) {
        arr.push(fn);
      } else {
        throw new Error(`${name} is not found`);
      }
    });
    options.methods.forEach(method => {
      options.urls.forEach(url => {
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
  if (!name || !util.isFunction(handler)) {
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
  if (!type || !util.isFunction(middleware)) {
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
