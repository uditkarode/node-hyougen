import { ErrorKind } from "./utils";

/*
    Throw this in case of a custom error
    that you want to display to the user.
    An error handler should handle the
    displaying process. 
*/
export class HyError extends Error {
  errorKind: ErrorKind;
  errorMsg: string;
  tag: string;
  extras: Record<string, unknown>;

  constructor(
    errorKind: ErrorKind,
    errorMsg: string,
    tag: string = "",
    extras: Record<string, unknown> = {},
  ) {
    super();
    this.errorKind = errorKind;
    this.errorMsg = errorMsg;
    this.tag = tag;
    this.extras = extras;
  }
}
