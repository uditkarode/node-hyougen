import { dtObj } from "https://deno.land/x/drytype@v0.2.1/mod.ts";
import { WrappedApp } from "./wrappers.ts";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers.ts";

export const getCodeFromKind = (e: ErrorKind) => {
  switch (e) {
    case ErrorKind.BAD_REQUEST:
      return 400;
    case ErrorKind.SERVER_ERROR:
      return 500;
    case ErrorKind.CONFLICT:
      return 409;
    case ErrorKind.FORBIDDEN:
      return 403;
  }
};

export const enum ErrorKind {
  BAD_REQUEST,
  SERVER_ERROR,
  CONFLICT,
  FORBIDDEN,
}

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
  post: "POST",
} as const;

export function getRoutedWrappedApp(
  wapp: WrappedApp,
  root: string,
  // deno-lint-ignore no-explicit-any
  ...rootMware: hyBodiedRouterMiddleware<any>[]
): WrappedApp {
  return {
    Listen: (port: number, callback: () => void) => wapp.Listen(port, callback),
    get: (ep, ...middleware) =>
      wapp.get(
        `${root}${ep}`,
        ...(rootMware as hyRouterMiddleware[]),
        ...middleware,
      ),
    post: (ep, structure, ...middleware) =>
      wapp.post(
        `${root}${ep}`,
        structure,
        // deno-lint-ignore no-explicit-any
        ...(rootMware as hyBodiedRouterMiddleware<any>[]),
        ...middleware,
      ),
    put: (ep, structure, ...middleware) =>
      wapp.post(
        `${root}${ep}`,
        structure,
        // deno-lint-ignore no-explicit-any
        ...(rootMware as hyBodiedRouterMiddleware<any>[]),
        ...middleware,
      ),

    saveApiDoc: () => wapp.saveApiDoc(),
  };
}
