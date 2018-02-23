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

  it('should start the service', async function () {
    await kaptan.start();

    http = kaptan.services.instances.get('HTTP') as HTTP;
    assert.equal(Boolean(http), true, 'HTTP service spwan error');
    assert.equal(http.server.listening, true);
  });

  it('should accept connections', function (done) {
    const addr = http.server.address();
    const socket = createConnection({ port: addr.port, host: addr.address })
      .on('connect', function () {
        if (socket.readable) {
          done();
        } else {
          done('Server doesn\'t accept conections');
        }

        socket.end();
        socket.destroy();
      });
  });

  const data = ['hello http', 'hello kaptan', 'hello service'];

  it('should add middleware', function () {
    http.use((request, response) => {
      response.write(data[0]);
    });

    http.use(async (request, response) => {
      response.write(data[1]);
    });

    http.use((request, response, next) => {
      response.end(data[2]);
      next();
    });

    http.use((request, response) => {
      throw new Error('This middleware should not have been called, response is ended');
    });
  });

  it('should run middlewares', function (done) {
    get('http://127.0.0.1:' + PORT, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        assert.equal(data.join(''), body, 'Response body is not equal to pre-defined data');
        done();
      });
    });
  });
  
  after (async function () {
    await kaptan.stop();
    assert.equal(http.server.listening, false, 'HTTP server still running after stop being called');
  })
});
