import { DryType, dtObj } from "drytypes";
import { WrappedApp } from "./wrappers";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers";

export type BodiedDtObj<T> = Record<string, DryType<T> | [DryType<T>, boolean]>;

export type RemoveOptionalErrorChoices<T> = T extends [DryType<infer U>, boolean] ? DryType<U> : T;

export type ObjRemoveOptionalErrorChoices<T extends BodiedDtObj<unknown>> = {
  [K in keyof T]: RemoveOptionalErrorChoices<T[K]>;
};

type GetExtension<T> = T extends BodiedDtObj<infer U> ? U : never;

export const removeErrorChoices = <T extends BodiedDtObj<unknown>>(bodiedDtObj: T) => {
  const ret: Partial<typeof bodiedDtObj> = {};

  for (const [k, v] of Object.entries(bodiedDtObj)) {
    ret[k as keyof T] = (Array.isArray(v) ? v[0] : v) as T[keyof T];
  }

  return ret as Record<string, DryType<GetExtension<T>>>;
};

export const enum ErrorKind {
  /** indicates that the server cannot or will not process the request because the received syntax is invalid, nonsensical, or exceeds some limitation on what the server is willing to process. */
  BAD_REQUEST,

  /** indicates that the request has not been applied because it lacks valid authentication credentials for the target resource. */
  UNAUTHORIZED,

  /** indicates that the server understood the request but refuses to authorize it. */
  FORBIDDEN,

  /** indicates that the origin server did not find a current representation for the target resource or is not willing to disclose that one exists. */
  NOT_FOUND,

  /** indicates that the method specified in the request-line is known by the origin server but not supported by the target resource. */
  METHOD_NOT_ALLOWED,

  /** indicates that the target resource does not have a current representation that would be acceptable to the user agent, according to the proactive negotiation header fields received in the request, and the server is unwilling to supply a default representation. */
  NOT_ACCEPTABLE,

  /** is similar to 401 (Unauthorized), but indicates that the client needs to authenticate itself in order to use a proxy. */
  PROXY_AUTHENTICATION_REQUIRED,

  /** indicates that the server did not receive a complete request message within the time that it was prepared to wait. */
  REQUEST_TIMEOUT,

  /** indicates that the request could not be completed due to a conflict with the current state of the resource. */
  CONFLICT,

  /** indicates that access to the target resource is no longer available at the origin server and that this condition is likely to be permanent. */
  GONE,

  /** indicates that the server refuses to accept the request without a defined Content-Length. */
  LENGTH_REQUIRED,

  /** indicates that one or more preconditions given in the request header fields evaluated to false when tested on the server. */
  PRECONDITION_FAILED,

  /** indicates that the server is refusing to process a request because the request payload is larger than the server is willing or able to process. */
  PAYLOAD_TOO_LARGE,

  /** indicates that the server is refusing to service the request because the request-target is longer than the server is willing to interpret. */
  URI_TOO_LONG,

  /** indicates that the origin server is refusing to service the request because the payload is in a format not supported by the target resource for this method. */
  UNSUPPORTED_MEDIA_TYPE,

  /** indicates that none of the ranges in the request's Range header field overlap the current extent of the selected resource or that the set of ranges requested has been rejected due to invalid ranges or an excessive request of small or overlapping ranges. */
  RANGE_NOT_SATISFIABLE,

  /** indicates that the expectation given in the request's Expect header field could not be met by at least one of the inbound servers. */
  EXPECTATION_FAILED,

  /** indicates that the server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol. */
  UPGRADE_REQUIRED,

  /** indicates that the server encountered an unexpected condition that prevented it from fulfilling the request. */
  INTERNAL_SERVER_ERROR,

  /** indicates that the server does not support the functionality required to fulfill the request. */
  NOT_IMPLEMENTED,

  /** indicates that the server, while acting as a gateway or proxy, received an invalid response from an inbound server it accessed while attempting to fulfill the request. */
  BAD_GATEWAY,

  /** indicates that the server is currently unable to handle the request due to a temporary overload or scheduled maintenance, which will likely be alleviated after some delay. */
  SERVICE_UNAVAILABLE,

  /** indicates that the server, while acting as a gateway or proxy, did not receive a timely response from an upstream server it needed to access in order to complete the request. */
  GATEWAY_TIMEOUT,

  /** indicates that the server does not support, or refuses to support, the protocol version that was used in the request message. */
  HTTP_VERSION_NOT_SUPPORTED,

  /** means the server understands the content type of the request entity (hence a 415(Unsupported Media Type) status code is inappropriate), and the syntax of the request entity is correct (thus a 400 (Bad Request) status code is inappropriate) but was unable to process the contained instructions. */
  UNPROCESSABLE_ENTITY,

  /** means the source or destination resource of a method is locked. */
  LOCKED,

  /** means that the method could not be performed on the resource because the requested action depended on another action and that action failed. */
  FAILED_DEPENDENCY,

  /** indicates that the origin server requires the request to be conditional. */
  PRECONDITION_REQUIRED,

  /** indicates that the user has sent too many requests in a given amount of time (rate limiting). */
  TOO_MANY_REQUESTS,

  /** indicates that the server is unwilling to process the request because its header fields are too large. */
  REQUEST_HEADER_FIELDS_TOO_LARGE,

  /** This status code indicates that the server is denying access to the resource in response to a legal demand. */
  UNAVAILABLE_FOR_LEGAL_REASONS,

  /** indicates that the server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself, and is therefore not a proper end point in the negotiation process. */
  VARIANT_ALSO_NEGOTIATES,

  /** means the method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request. */
  INSUFFICIENT_STORAGE,

  /** indicates that the client needs to authenticate to gain network access. */
  NETWORK_AUTHENTICATION_REQUIRED,
}

export const getCodeFromKind = (e: ErrorKind) => {
  switch (e) {
    case ErrorKind.BAD_REQUEST:
      return 400;
    case ErrorKind.UNAUTHORIZED:
      return 401;
    case ErrorKind.FORBIDDEN:
      return 403;
    case ErrorKind.NOT_FOUND:
      return 404;
    case ErrorKind.METHOD_NOT_ALLOWED:
      return 405;
    case ErrorKind.NOT_ACCEPTABLE:
      return 406;
    case ErrorKind.PROXY_AUTHENTICATION_REQUIRED:
      return 407;
    case ErrorKind.REQUEST_TIMEOUT:
      return 408;
    case ErrorKind.CONFLICT:
      return 409;
    case ErrorKind.GONE:
      return 410;
    case ErrorKind.LENGTH_REQUIRED:
      return 411;
    case ErrorKind.PRECONDITION_FAILED:
      return 412;
    case ErrorKind.PAYLOAD_TOO_LARGE:
      return 413;
    case ErrorKind.URI_TOO_LONG:
      return 414;
    case ErrorKind.UNSUPPORTED_MEDIA_TYPE:
      return 415;
    case ErrorKind.RANGE_NOT_SATISFIABLE:
      return 416;
    case ErrorKind.EXPECTATION_FAILED:
      return 417;
    case ErrorKind.UPGRADE_REQUIRED:
      return 426;
    case ErrorKind.INTERNAL_SERVER_ERROR:
      return 500;
    case ErrorKind.NOT_IMPLEMENTED:
      return 501;
    case ErrorKind.BAD_GATEWAY:
      return 502;
    case ErrorKind.SERVICE_UNAVAILABLE:
      return 503;
    case ErrorKind.GATEWAY_TIMEOUT:
      return 504;
    case ErrorKind.HTTP_VERSION_NOT_SUPPORTED:
      return 505;
    case ErrorKind.UNPROCESSABLE_ENTITY:
      return 422;
    case ErrorKind.LOCKED:
      return 423;
    case ErrorKind.FAILED_DEPENDENCY:
      return 424;
    case ErrorKind.PRECONDITION_REQUIRED:
      return 428;
    case ErrorKind.TOO_MANY_REQUESTS:
      return 429;
    case ErrorKind.REQUEST_HEADER_FIELDS_TOO_LARGE:
      return 431;
    case ErrorKind.UNAVAILABLE_FOR_LEGAL_REASONS:
      return 451;
    case ErrorKind.VARIANT_ALSO_NEGOTIATES:
      return 506;
    case ErrorKind.INSUFFICIENT_STORAGE:
      return 507;
    case ErrorKind.NETWORK_AUTHENTICATION_REQUIRED:
      return 511;
  }
};

export function Response(
  status: "success" | "failure",
  message: string,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  return { status: status, message: message.toString(), ...extras };
}

export function getParamsFromStructure<O extends dtObj>(structure: O) {
  let ret = "";
  for (const [k, v] of Object.entries(structure)) {
    ret += `${k}: ${(/DryType<(.+)>/.exec(String(v)) || ["", "unknown"])[1]}, `;
  }
  return ret.slice(0, -2);
}

export const METHODS = {
  get: "GET",
  head: "HEAD",
  options: "OPTIONS",
  post: "POST",
  put: "PUT",
  delete: "DELETE",
  patch: "PATCH",
} as const;

export function getRoutedWrappedApp(
  wapp: WrappedApp,
  root: string,
  ...rootMware: hyBodiedRouterMiddleware<any>[]
): WrappedApp {
  return {
    Listen: (port: number, callback: () => void) => wapp.Listen(port, callback),
    get: (ep, ...middleware) =>
      wapp.get(`${root}${ep}`, ...(rootMware as hyRouterMiddleware[]), ...middleware),
    head: (ep, ...middleware) =>
      wapp.head(`${root}${ep}`, ...(rootMware as hyRouterMiddleware[]), ...middleware),
    options: (ep, ...middleware) =>
      wapp.options(`${root}${ep}`, ...(rootMware as hyRouterMiddleware[]), ...middleware),
    post: (ep, structure, ...middleware) =>
      wapp.post(
        `${root}${ep}`,
        structure,
        ...(rootMware as hyBodiedRouterMiddleware<any>[]),
        ...middleware,
      ),
    put: (ep, structure, ...middleware) =>
      wapp.put(
        `${root}${ep}`,
        structure,
        ...(rootMware as hyBodiedRouterMiddleware<any>[]),
        ...middleware,
      ),
    delete: (ep, structure, ...middleware) =>
      wapp.delete(
        `${root}${ep}`,
        structure,
        ...(rootMware as hyBodiedRouterMiddleware<any>[]),
        ...middleware,
      ),
    patch: (ep, structure, ...middleware) =>
      wapp.patch(
        `${root}${ep}`,
        structure,
        ...(rootMware as hyBodiedRouterMiddleware<any>[]),
        ...middleware,
      ),

    saveApiDoc: () => wapp.saveApiDoc(),
  };
}
