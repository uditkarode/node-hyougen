import { ResponseStrings } from "./constants";
import { dtObj } from "drytypes";
import { METHODS } from "./utils";
import { BodiedMiddleware, NonBodiedMiddleware } from "./middleware";
import { Logger } from "./logger";
import { HyError } from "./hyougen-error";
import { getParams, recordBodiedRoute, recordRoute } from "./handlers";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers";
import { getCodeFromKind, Response } from "./utils";
import fs from 'fs';
import KoaRouter = require("koa-router");
import koa from 'koa';
import koaBody = require("koa-body");

import {
   DefaultState,
   DefaultContext,
   ParameterizedContext as KoaContext,
   Response as KoaResponse,
} from "koa";

type KoaApplication = koa<DefaultState, DefaultContext>;

const TAG = "hyougen/wrappers";

export interface WrappedApp {
  Listen(post: number, callback: () => void): void;

  get(
    ep: string,
    ...middleware: hyRouterMiddleware[]
  ): void;

  head(
    ep: string,
    ...middleware: hyRouterMiddleware[]
  ): void;

  options(
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

  delete<O extends dtObj>(
    ep: string,
    structure: O,
    ...middleware: hyBodiedRouterMiddleware<O>[]
  ): void;

  patch<O extends dtObj>(
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
export function getWrappedResponse(res: KoaResponse): WrappedResponse {
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
  app: KoaApplication,
  devMode = false,
): WrappedApp {
  /* set up custom error handler */
  app.use(
    async (
      ctx: KoaContext,
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

  const router = new KoaRouter();

  return {
    Listen: (port: number, callback: () => void, ip = "127.0.0.1") => {
      app.use(koaBody({ multipart: true }));
      app.use(router.allowedMethods());
      app.use(router.routes());
      app.listen(port, callback);
    },

    get: (
      ep: string,
      ...middleware: hyRouterMiddleware[]
    ) => {
      middleware.unshift(NonBodiedMiddleware);
      recordRoute(ep, METHODS.get, devMode);
      router.get(
        ep,
        // @ts-ignore the extra fields don't matter
        ...middleware 
      );
    },

    head: (
      ep: string,
      ...middleware: hyRouterMiddleware[]
    ) => {
      middleware.unshift(NonBodiedMiddleware);
      recordRoute(ep, METHODS.head, devMode);
      router.head(
        ep,
        // @ts-ignore the extra fields don't matter
        ...middleware
      );
    },

    options: (
      ep: string,
      ...middleware: hyRouterMiddleware[]
    ) => {
      middleware.unshift(NonBodiedMiddleware);
      recordRoute(ep, METHODS.options, devMode);
      router.options(
        ep,
        // @ts-ignore the extra fields don't matter
        ...middleware
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
          // @ts-ignore the extra fields don't matter
          ...middleware
        );
    },

    put: function <O extends dtObj>(
      ep: string,
      structure: O,
      ...middleware: hyBodiedRouterMiddleware<O>[]
    ) {
      middleware.unshift(BodiedMiddleware<O>(structure, devMode));
      recordBodiedRoute(ep, structure, METHODS.put, devMode),
        router.put(
          ep,
          // @ts-ignore the extra fields don't matter
          ...middleware
        );
    },

    delete: function <O extends dtObj>(
      ep: string,
      structure: O,
      ...middleware: hyBodiedRouterMiddleware<O>[]
    ) {
      middleware.unshift(BodiedMiddleware<O>(structure, devMode));
      recordBodiedRoute(ep, structure, METHODS.delete, devMode),
        router.delete(
          ep,
          // @ts-ignore the extra fields don't matter
          ...middleware
        );
    },

    patch: function <O extends dtObj>(
      ep: string,
      structure: O,
      ...middleware: hyBodiedRouterMiddleware<O>[]
    ) {
      middleware.unshift(BodiedMiddleware<O>(structure, devMode));
      recordBodiedRoute(ep, structure, METHODS.patch, devMode),
        router.patch(
          ep,
          // @ts-ignore the extra fields don't matter
          ...middleware
        );
    },

    saveApiDoc: () => {
      if (!devMode)
        return Logger.error(
          "Cannot save documentation in production env. Ignoring.",
          TAG
        );

      fs.writeFileSync("doc.md", "");
      const docStream = fs.createWriteStream("doc.md");

      docStream.on("finish", () => {
        Logger.success("API doc saved to doc.md", TAG);
        docStream.close();
      });

      const params = getParams();

      for (const m in params) {
        const method = params[m];
        docStream.write(`# ${m} routes\n`);
        switch (m) {
          case METHODS.get: {
            if (method.length > 0) {
              method.forEach((route) => {
                docStream.write(`${route}\n\n`);
              });
            }
            break;
          }

          case METHODS.post: {
            if (method.length > 0) {
              method.forEach((route) => {
                docStream.write(`${route}\n\n`);
              });
            }
            break;
          }
        }
      }

      docStream.close();
    },
  };
}
