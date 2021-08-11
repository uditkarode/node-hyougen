import { ErrorKind, getParamsFromStructure } from "./utils.ts";
import { ResponseStrings } from "./constants.ts";
import { dtObj } from "https://deno.land/x/drytype@v0.2.1/mod.ts";
import {
  ExactRecord as DryRecord,
  ValidationError,
} from "https://deno.land/x/drytype@v0.2.1/mod.ts";
import { HyError } from "./hyougen-error.ts";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers.ts";
import { getWrappedResponse } from "./wrappers.ts";
import {
  FormDataFile,
  FormDataReader,
} from "https://deno.land/x/oak@v7.7.0/mod.ts";

const TAG = "middleware.ts";

export const NonBodiedMiddleware: hyRouterMiddleware = (context, next) => {
  context.hyRes = getWrappedResponse(context.response);
  next();
};

export function BodiedMiddleware<O extends dtObj>(
  structure: O,
  devMode: boolean,
): hyBodiedRouterMiddleware<O> {
  return async (ctx, next) => {
    try {
      if (!ctx.request.hasBody) {
        throw new HyError(
          ErrorKind.BAD_REQUEST,
          ResponseStrings.ERR_BODY_NOT_PROVIDED,
          TAG,
        );
      }

      const reqBody = ctx.request.body();
      const objBody: Record<string, unknown> = {};
      const files: Record<string, FormDataFile> = {};

      const body = await reqBody.value;

      switch (reqBody.type) {
        case "form":
          for (const [k, v] of (body as URLSearchParams).entries()) {
            objBody[k] = v;
          }
          break;

        case "form-data":
          for await (const item of (body as FormDataReader).stream()) {
            if (typeof (item[1]) == "string") {
              // this is a string field
              objBody[item[0]] = item[1];
            } else {
              files[item[1]["name"]] = item[1];
            }
          }
          break;

        default:
          throw new Error(
            `Support for ${reqBody.type} bodies not yet added!`,
          );
      }

      // strictGuard throws
      if (DryRecord<O>(structure).strictGuard(objBody)) {
        ctx.hyBody = objBody;
        ctx.hyFiles = files;
        ctx.hyRes = getWrappedResponse(ctx.response);
        await next();
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        if (devMode) {
          throw new HyError(
            ErrorKind.BAD_REQUEST,
            ResponseStrings.ERR_INC_BODY,
            TAG,
            {
              devNote: e.message,
              expectedBody: getParamsFromStructure(structure),
            },
          );
        } else {
          throw new HyError(
            ErrorKind.BAD_REQUEST,
            ResponseStrings.ERR_GENERIC,
            TAG,
          );
        }
      } else throw e;
    }
  };
}
