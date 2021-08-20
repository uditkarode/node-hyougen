import { ErrorKind, getParamsFromStructure } from "./utils";
import { ResponseStrings } from "./constants";
import { dtObj, ExactRecord as DryRecord, ValidationError } from "drytypes";
import { HyError } from "./hyougen-error";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers";
import { getWrappedResponse } from "./wrappers";
import {} from "koa-body";

const TAG = "hyougen/middleware";

export const NonBodiedMiddleware: hyRouterMiddleware = async (
  context,
  next,
) => {
  context.hyRes = getWrappedResponse(context.response);
  await next();
};

export function BodiedMiddleware<O extends dtObj>(
  structure: O,
  devMode: boolean,
): hyBodiedRouterMiddleware<O> {
  return async (ctx, next) => {
    try {
      if (!ctx.request.body) {
        throw new HyError(
          ErrorKind.BAD_REQUEST,
          ResponseStrings.ERR_BODY_NOT_PROVIDED,
          TAG,
        );
      }

      const objBody = ctx.request.body;
      const files = ctx.request.files;

      // strictGuard throws
      if (DryRecord<O>(structure).strictGuard(objBody)) {
        ctx.hyBody = objBody;
        ctx.hyFiles = files ?? {};
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
