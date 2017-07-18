import 'mocha';
import { assert } from 'chai';
import * as getPort from 'get-port';

import { Kaptan } from 'kaptan';
import { createConnection } from 'net';
import { get } from 'http';

import { HTTP } from '../build';

describe('Service/HTTP', function () {
  const kaptan = new Kaptan();
  let PORT = 55695;
  let http: HTTP;

  before(async function () {
    PORT = await getPort();
    kaptan.use(HTTP, { PORT });
  });

  it('should start the service', function (done) {
    kaptan.start();

    http = kaptan.services.instances.get('HTTP') as HTTP;
    assert.equal(Boolean(http), true);

    http.server.on('listening', () => done());
  });

  it('should accept connections', function (done) {
    const addr = http.server.address();
    createConnection({ port: addr.port, host: addr.address })
      .on('connect', () => done());
  });

  it('should handle requests', function (done) {
    http.once('request:/', (request, response) => done());
    get('http://127.0.0.1:' + PORT);
  });

  it('should run all middlewares', function (done) {
    var complete = () => { complete = () => { complete = done } };

    http.once('request', (request, response) => (next: Function) => {
      request.foo = 'bar'; 
      next();
      complete();
    });
    http.once('request', (request, response) => new Promise((resolve) => {
      assert.equal(request.foo, 'bar');
      resolve();
      complete();
    }));
    http.once('request', () => 'hello');
    http.once('request', () => complete());

    get('http://127.0.0.1:' + PORT);
  });
});
