class HttpError extends Error {
  constructor(status = 500, message = 'Server Error', publicMessage = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    // message safe for client when in production; if null, use generic mapping
    this.publicMessage = publicMessage;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HttpError;
