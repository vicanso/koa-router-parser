# router parser for koa

[![Build Status](https://travis-ci.org/vicanso/koa-router-parser.svg?style=flat-square)](https://travis-ci.org/vicanso/koa-router-parser)
[![Coverage Status](https://img.shields.io/coveralls/vicanso/koa-router-parser/master.svg?style=flat)](https://coveralls.io/r/vicanso/koa-router-parser?branch=master)
[![npm](http://img.shields.io/npm/v/koa-router-parser.svg?style=flat-square)](https://www.npmjs.org/package/koa-router-parser)
[![Github Releases](https://img.shields.io/npm/dm/koa-router-parser.svg?style=flat-square)](https://github.com/vicanso/koa-router-parser)

## Installation

```bash
$ npm install koa-router-parser
```

### Get a parse router

```js
const parser = require('koa-router-parser');
const Koa = require('koa');

// add default middleware, common is for all type
parser.addDefault('common', (ctx, next) => {
  console.info(ctx.url);
  return next();
});

parser.add('getUser', (ctx, next) => {
  const id = ctx.params.id;
  const getUser = new Promise(resolve => {
    setTimeout(() => {
      ctx.user = {
        name: 'vicanso'
      };
      resolve();
    }, 100);
  });
  return getUser.then(next);
});

parser.add('getFavorites', (ctx) => {
  const user = ctx.user;
  const getFavorites = new Promise(resolve => {
    setTimeout(() => {
      ctx.body = [{
        name: 'javascript'
      }, {
        name: 'go'
      }];
      resolve();
    }, 100);
  });
  return getFavorites;
});

parser.add('check-version', (version) => {
  return (ctx, next) => {
    const v = parseInt(ctx.query.version);
    if (v === version) {
      return next();
    } else {
      throw new Error('version is wrong');
    }
  };
});

const router = parser.parse([
  '[GET,POST] [/user/favorites/:id,/user/:id] [check-version(1) & getUser & getFavorites]',
  {
    methods: ['GET'],
    urls: ['/user/me'],
    handlers: ['getUser'],
  },
  [
    ['GET', 'POST'],
    ['/user/favorites/:id', '/user/:id'],
    [
      (ctx, next) => next(),
      'check-version(1)',
      'getUser',
      'getFavorites',
    ],
  ],
  [
    'GET',
    '/users',
    [
      'getUser',
    ],
  ],
]);
const app = new Koa();
app.use(router.routes());
request(app.listen())
  .get('/user/favorites/1234?version=1')
  .end((err, res) => {
    if (err) {
      console.error(err);
    } else {
      // [{"name":"javascript"},{"name":"go"}]
      console.info(JSON.stringify(res.body));
    }
  });

```

## License

MIT
