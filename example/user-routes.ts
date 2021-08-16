import { getRoutedWrappedApp, WrappedApp } from "../src/index";

export default (wapp: WrappedApp, root: string) => {
  const app = getRoutedWrappedApp(wapp, root, (_, next) => {
    console.log("Everything here passes through me!");
    next();
  });

  app.get("/", (ctx) => {
    ctx.hyRes.success("This is the user routes section!", {
      whatAreYouDoingHere: "noIdea",
    });
  });
};
