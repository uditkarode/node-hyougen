import { dtObj, dtObjStatic } from "drytypes";
import { WrappedResponse } from "./wrappers";
import { ExtendableContext as RouterContext } from "koa";
import { Files } from "formidable";

export type NonBodiedContext = RouterContext & { hyRes: WrappedResponse };

export type BodiedContext<O extends dtObj> = RouterContext & {
  hyBody: dtObjStatic<O>;
  hyRes: WrappedResponse;
  hyFiles: Files;
};

export type hyRouterMiddleware = (
  ctx: NonBodiedContext,
  next: () => Promise<any>,
) => Promise<unknown> | unknown;

export type hyBodiedRouterMiddleware<O extends dtObj> = (
  ctx: BodiedContext<O>,
  next: () => Promise<any>,
) => Promise<unknown> | unknown;
