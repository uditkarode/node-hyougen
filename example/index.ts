import { Logger } from "../src/logger.ts";
import { getWrappedApp } from "../src/index.ts";
import userRoutes from "./user-routes.ts";
import { String } from "https://deno.land/x/drytype@v0.2.1/mod.ts";
import {
  Application,
  HttpServerNative,
} from "https://deno.land/x/oak@v7.7.0/mod.ts";

const app = getWrappedApp(
  new Application({ serverConstructor: HttpServerNative }),
  true,
);

const TAG = "index.ts";

app.get("/testGet", (_, next) => {
  console.log("heu!");
  next();
}, (ctx) => {
  ctx.hyRes.genericSuccess();
});

app.post("/testPost", { username: String }, (ctx) => {
  console.log(ctx.hyFiles);
  ctx.hyRes.genericSuccess();
});

app.put("/testPut", { username: String }, (ctx) => {
  console.log(ctx.hyFiles);
  ctx.hyRes.genericSuccess();
});

userRoutes(app, "/user");

app.Listen(8040, () => {
  app.saveApiDoc();
  Logger.info("Running on port 8040!", TAG);
});
