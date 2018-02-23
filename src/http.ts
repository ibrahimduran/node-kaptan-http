import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { Kaptan, Service } from 'kaptan';

export type Middleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => Promise<any> | void

export class HTTP extends Service {
  private middlewares: Middleware[] = []
  
  protected options: HTTPOptions;
  public readonly server: Server;

  constructor(kaptan: Kaptan, options: HTTPOptions = {}) {
    super(kaptan, {
      PORT: process.env.HTTP_PORT || process.env.PORT || 80,
      ...options
    });

    this.server = createServer(this.handler.bind(this));
  }

  use (fn: Middleware) {
    this.middlewares.push(fn)
  }

  async start () {
    this.logger.text(`listening on :${this.options.PORT}`)
    this.server.listen(this.options.PORT);
  }

  stop () {
    return new Promise<void>((resolve, reject) => {
      this.server.close(() => resolve())
    })
  }

  private async handler (request: IncomingMessage, response: ServerResponse, mc = 0) {
    if (mc >= this.middlewares.length || response.finished) {
      if (response.writable) {
        response.end()
      }

      return
    }

    let next = () => {
      this.handler(request, response, mc + 1)
      next = () => {}
    }
    
    const returned = this.middlewares[mc](request, response, next)

    if (returned !== undefined && returned instanceof Promise) {
      await returned
      next()
    } else if (this.middlewares[mc].length <= 2) {
      next()
    }
  }
}

export interface HTTPOptions {
  PORT?: number | string
}
