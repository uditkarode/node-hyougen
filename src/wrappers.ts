import { ResponseStrings } from "./constants.ts";
import { dtObj } from "https://deno.land/x/drytype@v0.2.1/mod.ts";
import { METHODS } from "./utils.ts";
import { BodiedMiddleware, NonBodiedMiddleware } from "./middleware.ts";
import { Logger } from "./logger.ts";
import { HyError } from "./hyougen-error.ts";
import { getParams, recordBodiedRoute, recordRoute } from "./handlers.ts";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers.ts";
import { getCodeFromKind, Response } from "./utils.ts";

import {
  Application as OakApplication,
  Context as OakContext,
  Response as OakResponse,
  Router as OakRouter,
  RouterMiddleware,
} from "https://deno.land/x/oak@v7.7.0/mod.ts";

const TAG = "wrappers.ts";

export interface WrappedApp {
  Listen(post: number, callback: () => void): void;

  get(
    ep: string,
    ...middleware: hyRouterMiddleware[]
  ): void;

  post<O extends dtObj>(
    ep: string,
    structure: O,
    ...middleware: hyBodiedRouterMiddleware<O>[]
  ): void;

  put<O extends dtObj>(
    ep: string,
    structure: O,
    ...middleware: hyBodiedRouterMiddleware<O>[]
  ): void;

  /* only for dev environment */
  saveApiDoc(): void;
}

export interface WrappedResponse {
  success(message: string, extras?: Record<string, unknown>): void;
  genericSuccess(): void;
}

/* custom type getters */
export function getWrappedResponse(res: OakResponse): WrappedResponse {
  return {
    success: function Success(
      message: string = ResponseStrings.SUCC_GENERIC,
      extras: Record<string, unknown> = {},
    ) {
      res.body = Response("success", message, extras);
    },
    genericSuccess: function GenericSuccess() {
      res.body = Response("success", ResponseStrings.SUCC_GENERIC);
    },
  };
}

export function getWrappedApp(
  app: OakApplication<Record<string, unknown>>,
  devMode = false,
): WrappedApp {
  /* set up custom error handler */
  app.use(
    async (
      ctx: OakContext,
      next: () => Promise<unknown>,
    ) => {
      try {
        await next();
      } catch (error) {
        if (error instanceof HyError) {
          ctx.response.status = getCodeFromKind(error.errorKind);
          ctx.response.body = Response("failure", error.errorMsg, error.extras);
          if (devMode) {
            Logger.error(
              error.stack || "No stack!",
              error.tag + " (dev-only) ",
            );
          }
        } else {
          let culprit = "Unknown";

          if (error.stack) {
            const stack = error.stack.split("\n")[2].split("/");
            culprit = stack[stack.length - 1].split(":")[0];
          }

          Logger.error(error.stack || "No stack!", culprit);
          ctx.response.status = 500;
          ctx.response.body = Response("failure", ResponseStrings.ERR_GENERIC);
        }
      }
    },
  );

  const router = new OakRouter();

  return {
    Listen: (port: number, callback: () => void, ip = "127.0.0.1") => {
      app.use(router.allowedMethods());
      app.use(router.routes());
      app.addEventListener("listen", () => {
        callback();
      });
      app.listen(`${ip}:${port}`);
    },

    get: (
      ep: string,
      ...middleware: hyRouterMiddleware[]
    ) => {
      middleware.unshift(NonBodiedMiddleware);
      recordRoute(ep, METHODS.get, devMode);
      router.get(
        ep,
        ...middleware as [RouterMiddleware, ...RouterMiddleware[]],
      );
    },

    post: function <O extends dtObj>(
      ep: string,
      structure: O,
      ...middleware: hyBodiedRouterMiddleware<O>[]
    ) {
      middleware.unshift(BodiedMiddleware<O>(structure, devMode));
      recordBodiedRoute(ep, structure, METHODS.post, devMode),
        router.post(
          ep,
          ...middleware as [RouterMiddleware, ...RouterMiddleware[]],
        );
    },

    put: function <O extends dtObj>(
      ep: string,
      structure: O,
      ...middleware: hyBodiedRouterMiddleware<O>[]
    ) {
      middleware.unshift(BodiedMiddleware<O>(structure, devMode));
      recordBodiedRoute(ep, structure, METHODS.post, devMode),
        router.put(
          ep,
          ...middleware as [RouterMiddleware, ...RouterMiddleware[]],
        );
    },

    saveApiDoc: () => {
      if (!devMode) {
        return Logger.error(
          "Cannot save documentation in production env. Ignoring.",
          TAG,
        );
      }

      Deno.writeTextFileSync("doc.md", "");
      let docStr = "";

      const params = getParams();

      for (const m in params) {
        const method = params[m];
        docStr += `# ${m} routes\n`;
        switch (m) {
          case METHODS.get: {
            if (method.length > 0) {
              method.forEach((route) => {
                docStr += `${route}\n\n`;
              });
            }
            break;
          }

          case METHODS.post: {
            if (method.length > 0) {
              method.forEach((route) => {
                docStr += `${route}\n\n`;
              });
            }
            break;
          }
        }
      }

      Deno.writeTextFileSync("doc.md", docStr);
      Logger.success("API doc saved to doc.md", TAG);
    },
  };
}
