# router parser for koa

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

const router = parser.parse('GET /user/favorites/:id getUser,getFavorites')
const app = new Koa();
app.use(router.routes());
request(app.listen())
	.get('/user/favorites/1234')
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