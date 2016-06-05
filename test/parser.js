'use strict';
const request = require('supertest');
const Koa = require('koa');
const assert = require('assert');


const parser = require('../lib/parser');
describe('koa-router-parser', () => {
  parser.add('user', (ctx) => {
    ctx.body = {
      name: 'vicanso'
    };
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

  parser.add('check-name', (name) => {
    return (ctx, next) => {
      if (ctx.query.name === name) {
        return next();
      } else {
        throw new Error('name is wrong');
      }
    };
  });

  parser.add('check-options', (options, version) => {
    return (ctx, next) => {
      const v = parseInt(ctx.query.version);
      if (v == version && ctx.query.tag === options.tag) {
        return next();
      } else {
        throw new Error('check options fail');
      }
    };
  });



  it('should add router handler successful', (done) => {
    const fn = (ctx, next) => {

    };
    parser.add('test', fn);
    assert.equal(parser.get('test'), fn);
    assert.equal(parser.remove('test'), fn);
    assert(!parser.get('test'));
    done();
  });

  it('should throw error when parse desc is null', done => {
    try {
      parser.parse();
    } catch (err) {
      assert.equal(err.message, 'desc can not be null');
      done();
    }
  });

  it('should throw error when parse desc is invalid', done => {
    try {
      parser.parse('GET /');
    } catch (err) {
      assert.equal(err.message, 'desc is invalid');
      done();
    }
  });

  it('should parse router successful', done => {

    const router = parser.parse('GET /user user');
    const app = new Koa();
    app.use(router.routes());

    request(app.listen())
      .get('/user')
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        assert.equal(res.body.name, 'vicanso');
        done();
      });
  });

  it('should parse get,post router successful', done => {
    const router = parser.parse('GET|POST /user user');
    const app = new Koa();
    const server = app.listen();
    let finishedCount = 0;
    const finish = (err, res) => {
      if (err) {
        return done(err);
      }
      assert.equal(res.body.name, 'vicanso');

      finishedCount++;
      if (finishedCount === 2) {
        done();
      }
    };
    app.use(router.routes());

    request(server)
      .get('/user')
      .end(finish);

    request(server)
      .post('/user')
      .send({
        name: 'vicanso'
      })
      .end(finish);
  });


  it('should parse /user /user/:id router successful', done => {
    const router = parser.parse('GET /user|/user/:id user');
    const app = new Koa();
    const server = app.listen();
    let finishedCount = 0;
    const finish = (err, res) => {
      if (err) {
        return done(err);
      }
      assert.equal(res.body.name, 'vicanso');

      finishedCount++;
      if (finishedCount === 2) {
        done();
      }
    };
    app.use(router.routes());

    request(server)
      .get('/user')
      .end(finish);

    request(server)
      .get('/user/123')
      .end(finish);
  });

  it('should parse multi middleware successful', done => {
    const router = parser.parse('GET /user/favorites/:id getUser&getFavorites');
    const app = new Koa();
    app.use(router.routes());
    request(app.listen())
      .get('/user/favorites/1234')
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        assert.equal(res.status, 200);
        assert.equal(res.body.length, 2);
        done();
      });

  });

  it('should parse function with defaultMiddlewares successful', done => {

    const router = parser.parse('GET|POST /user user');
    const app = new Koa();
    const server = app.listen();
    let finishedCount = 0;
    const finish = (err, res) => {
      if (err) {
        return done(err);
      }
      assert.equal(res.body.name, 'vicanso');

      finishedCount++;
      if (finishedCount === 2) {
        parser.removeDefault('common');
        done();
      }
    };
    parser.addDefault('common', (ctx, next) => {
      assert.equal(ctx.url, '/user');
      return next();
    });
    app.use(router.routes());

    request(server)
      .get('/user')
      .end(finish);

    request(server)
      .post('/user')
      .send({
        name: 'vicanso'
      })
      .end(finish);
  });

  it('should parse function with params successful', done => {
    const router = parser.parse('GET /user check-version(1)&check-name("vicanso")&check-options({"tag":"a"},1)&user');

    const app = new Koa();
    app.use(router.routes());

    request(app.listen())
      .get('/user?version=1&name=vicanso&tag=a')
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        assert.equal(res.body.name, 'vicanso');
        done();
      });
  })

});