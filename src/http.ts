import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { Kaptan, Service } from 'kaptan';

export class HTTP extends Service {
  protected options: HTTPOptions;
  public readonly server: Server;

  constructor(kaptan: Kaptan, options: HTTPOptions = {}) {
    super(kaptan, {
      PORT: process.env.HTTP_PORT || process.env.PORT || 80,
      ...options
    });

    this.server = createServer(this.onRequest.bind(this));
    this.server.listen(this.options.PORT);
  }

  public once(event: string | symbol, listener: (...args: any[]) => void): this {
    Service.prototype.onceIntercepted.apply(this, arguments);
    return this;
  }

  public on(event: string | symbol, listener: (...args: any[]) => void): this {
    Service.prototype.onIntercepted.apply(this, arguments);
    return this;
  }

  private async onRequest(request: IncomingMessage, response: ServerResponse) {
    const method = (<string>request.method).toLowerCase();
    const url = <string>request.url;

    await this.emitIntercepted('request', request, response)
    await this.emitIntercepted(`request:${method}`, request, response);
    await this.emitIntercepted(`request:${url}`, request, response);
    await this.emitIntercepted(`request:${method}:${url}`, request, response);
  }
}

export type MiddlewareCallback = (
  request: IncomingMessage,
  response: ServerResponse
) => void | Function;

export interface HTTPOptions {
  PORT?: number | string
}
