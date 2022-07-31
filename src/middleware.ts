import {
  BodiedDtObj,
  ErrorKind,
  getParamsFromStructure,
  ObjRemoveOptionalErrorChoices,
  removeErrorChoices,
} from "./utils";
import { ResponseStrings } from "./constants";
import { dtObjStatic, ExactRecord as DryRecord, ValidationError } from "drytypes";
import { HyError } from "./hyougen-error";
import { hyBodiedRouterMiddleware, hyRouterMiddleware } from "./routers";
import { getWrappedResponse } from "./wrappers";
import {} from "koa-body";
import { inspect } from "util";

const TAG = "hyougen/middleware";

export const NonBodiedMiddleware: hyRouterMiddleware = async (context, next) => {
  context.hyRes = getWrappedResponse(context.response);
  await next();
};

export function BodiedMiddleware<O extends BodiedDtObj<unknown>>(
  structure: O,
  devMode: boolean,
): hyBodiedRouterMiddleware<O> {
  return async (ctx, next) => {
    try {
      if (!ctx.request.body) {
        throw new HyError(ErrorKind.BAD_REQUEST, ResponseStrings.ERR_BODY_NOT_PROVIDED, TAG);
      }

      const body = ctx.request.body;
      const files = ctx.request.files;

      const validation = DryRecord<ObjRemoveOptionalErrorChoices<O>>(
        removeErrorChoices(structure),
      ).validate(body);

      if (validation.success) {
        ctx.hyBody = body as dtObjStatic<ObjRemoveOptionalErrorChoices<O>>;
        ctx.hyFiles = files ?? {};
        ctx.hyRes = getWrappedResponse(ctx.response);
        await next();
      } else {
        if (validation.in) {
          const v = structure[validation.in! as keyof typeof structure];
          if (Array.isArray(v))
            throw new HyError(
              ErrorKind.BAD_REQUEST,
              validation.message! ?? "",
              "hyougen/middleware",
            );
          else throw new ValidationError(validation.message);
        } else throw new ValidationError(validation.message);
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        if (devMode) {
          throw new HyError(ErrorKind.BAD_REQUEST, ResponseStrings.ERR_INC_BODY, TAG, {
            devNote: e.message,
            expectedBody: getParamsFromStructure(removeErrorChoices(structure)),
          });
        } else {
          throw new HyError(ErrorKind.BAD_REQUEST, ResponseStrings.ERR_GENERIC, TAG);
        }
      } else throw e;
    }
  };
}
