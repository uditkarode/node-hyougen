import { Logger } from "../src/logger";
import { getWrappedApp } from "../src/index";
import { makeDryType, String } from "drytypes";
import userRoutes from "./user-routes";
import koa from "koa";

const app = getWrappedApp(new koa(), true);

const TAG = "hyougen/examples/index";

app.get(
  "/testGet",
  (_, next) => {
    console.log("heu!");
    next();
  },
  ctx => {
    ctx.hyRes.genericSuccess();
  },
);

const Password = makeDryType<string>(x => {
  if (!String.guard(x)) return { success: false };

  if (x.length < 6 || x.length > 30)
    return {
      success: false,
      message: "Password must be 6-30 characters long",
    };
  else return { success: true };
}, "password (string) ");

app.post("/testPost", { password: [Password, true] }, ctx => {
  ctx.hyRes.success("nice work buddy, you sent me " + ctx.hyBody.password, {
    hey: "hello",
  });
});

app.put("/testPut", { username: String }, ctx => {
  console.log(ctx.hyFiles);
  ctx.hyRes.genericSuccess();
});

userRoutes(app, "/user");

app.Listen(8040, () => {
  app.saveApiDoc();
  Logger.info("Running on port 8040!", TAG);
});
