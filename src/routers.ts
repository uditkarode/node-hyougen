import { dtObj, dtObjStatic } from "https://deno.land/x/drytype@v0.2.1/mod.ts";
import { WrappedResponse } from "./wrappers.ts";
import {
  FormDataFile,
  RouterContext,
} from "https://deno.land/x/oak@v7.7.0/mod.ts";

export type NonBodiedContext = RouterContext & { hyRes: WrappedResponse };

export type BodiedContext<O extends dtObj> = RouterContext & {
  hyBody: dtObjStatic<O>;
  hyRes: WrappedResponse;
  hyFiles: Record<string, FormDataFile>;
};

export type hyRouterMiddleware = (
  context: NonBodiedContext,
  next: () => Promise<unknown>,
) => void | Promise<void>;

export type hyBodiedRouterMiddleware<O extends dtObj> = (
  ctx: BodiedContext<O>,
  next: () => Promise<unknown>,
) => void | Promise<void>;
