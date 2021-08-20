import { dtObj, dtObjStatic } from "drytypes";
import { WrappedResponse } from "./wrappers";
import { ParameterizedContext } from "koa";
import { RouterParamContext } from "@koa/router";
import { Files } from "formidable";

type RouterContext = ParameterizedContext<
  any,
  RouterParamContext<any, {}>,
  any
>;

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
