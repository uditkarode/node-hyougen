import { Logger } from "../src/logger";
import { getWrappedApp } from "../src/index";
import userRoutes from "./user-routes";
import { String } from "drytypes";
import koa from "koa";

const app = getWrappedApp(new koa());

const TAG = "hyougen/examples/index";

app.get("/testGet", (_, next) => {
  console.log("heu!");
  next();
}, (ctx) => {
  ctx.hyRes.genericSuccess();
});

app.post("/testPost", { username: String }, (ctx) => {
  ctx.hyRes.success("nice work buddy, you sent me " + ctx.hyBody.username, {
    hey: "hello",
  });
});

app.put("/testPut", { username: String }, (ctx) => {
  console.log(ctx.hyFiles);
  ctx.hyRes.genericSuccess();
});

// userRoutes(app, "/user");

app.Listen(8040, () => {
  app.saveApiDoc();
  Logger.info("Running on port 8040!", TAG);
});
