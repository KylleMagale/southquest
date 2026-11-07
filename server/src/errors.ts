/** An error the API turns into a clear message for the browser (400 by default). */
export class BadRequest extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}