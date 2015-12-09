'use strict';
const KoaRouter = require('koa-router');
const util = require('util');
const routerHandlers = {};
exports.parse = parse;
exports.add = add;
exports.get = get;
exports.remove = remove;
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
	const methods = arr[0].split(',').map(method => {
		return method.toLowerCase();
	});
	for (let i = 0; i < methods.length; i++) {
		let method = methods[i];
		if ('head options get put patch post delete'.indexOf(method) === -1) {
			throw new Error(`${method} is not support`);
		}
	}


	return {
		methods: methods,
		urls: arr[1].split(','),
		handlers: arr[2].split(',')
	};
}

/**
 * [parse description]
 * @param  {[type]} desc [description]
 * @return {[type]}     [description]
 */
function parse(desc) {
	const router = new KoaRouter();
	const descList = util.isArray(desc) ? desc : [desc];
	descList.forEach(desc => {
		const options = covert(desc);
		const arr = [];
		options.handlers.forEach(name => {
			const fn = get(name);
			/* istanbul ignore else */
			if (fn) {
				arr.push(fn);
			}
		});
		options.methods.forEach(method => {
			options.urls.forEach(url => {
				const tmpArr = arr.slice();
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
 * [get description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
function get(name) {
	return routerHandlers[name];
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