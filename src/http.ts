import { createServer, Server, IncomingMessage, ServerResponse} from 'http';
import { Kaptan, Service } from 'kaptan';

export class HTTP extends Service {
  public static Options: HTTPOptions = {
    PORT: process.env.HTTP_PORT || process.env.PORT || 80
  };

  public readonly server: Server;

  constructor(kaptan: Kaptan) {
    super(kaptan);

    this.server = createServer(this.onRequest.bind(this));
    this.server.listen(HTTP.Options.PORT);
  }

  private onRequest(request: IncomingMessage, response: ServerResponse) {
    const middlewares = this.listeners('request');

    var runAllMiddlewares = () => {
      if (middlewares.length === 0) return;

      const middleware = middlewares.shift() as Function;
      const returned = middleware(request, response);

      if (returned) {
        if (typeof returned === 'function') {
          return returned(runAllMiddlewares);
        }
        else if (typeof returned === 'object' && returned.constructor.name === 'Promise') {
          return returned.then(() => runAllMiddlewares());
        }
      }

      runAllMiddlewares();
    };

    runAllMiddlewares();

    this.emit('request:' + request.url, request, response);
  }
}

export type MiddlewareCallback = (
  request: IncomingMessage,
  response: ServerResponse
) => void | Function;

export interface HTTPOptions {
  PORT?: number | string
}
