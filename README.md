# hyougen (node)
A wrapper for koa.js with some handy stuff!

## What?
Hyougen adds:
* runtime validation of body for `POST` requests
* typescript guards and autocomplete for `POST` bodies
* automatic exception handling
* logger with a pretty output
* additional help while testing in 'dev' env
* ability to auto-generate an API documentation

## How?
The first thing you need to do is to get an instance of a `WrappedApp`, which you can do using `getWrappedApp(yourKoaApp, true)`. The second argument is whether to enable developer mode (dev-mode) or not. Keep this set to false when running in prod. The effects it has will be explained ahead.
  
A non-bodied route is defined like
```typescript
app.get("/endpoint", ...middleware, async ctx => {
  ...
});
```
For a non-bodied route (i.e. a route that doesn't accept a body, such as GET/HEAD routes), ctx will contain the following new properties:
* `hyRes: WrappedResponse`  
I'll talk about WrappedResponse ahead.
  
A bodied route (such as a POST/PUT route) is defined like
```typescript
app.post("/endpoint", {
  username: String,
  age: Number
}, ...middleware, async ctx => {
  ctx.body.usern //autocomplete
});
```
The second argument here is the POST body that you're expecting for this route. In case this **exact** body is not received, a `ValidationError` will be thrown -- this will send back a properly formatted error. In case dev-mode is enabled, the error will also contain a `devNote` explaining why a `ValidationError` was thrown, and what the expected body is.
  
For a bodied route, `ctx` is a koa context with the following extra properties:
* `hyRes: WrappedResponse`
* `hyBody: dtObjStatic`
* `hyFiles: formidable.Files`
  
`hyBody` is essentially an object with parameters that a request receives, and has the same keys as the second argument to the route. You can be sure that whatever route logic you write will always be run with a proper body, since if it was invalid, a validation error would have been thrown and the route logic would never have been executed.
  
Now, coming to the type `WrappedResponse`. It contains:
* `genericSuccess` -- a function that you can call to send back `{"status":"success","message":"Operation successful!"}`
* `success` -- a function that takes two arguments, the first one being the message field in `{"status":"success","message":"..."}`, and the second one being an object that will be added to the response. For example, if the third argument is `{ name: "Jim" }`, the response will be `{"status":"success","message":"...", name: "Jim" }`.

Hence if you call
```typescript
ctx.hyRes.success("Your wish has been granted", { wishId: 1337 });
// {"status":"success","message":"Your wish has been granted","wishId":1337}
```
This is a convenience function so that API successes are easy to send back. `genericSuccess` could be used when there's no data to send back except for a success or failure.
  
# Error handling

## What about when things go wrong?
Errors, in my opinion, should be split into two kinds -- one category is user facing errors, and the other is internal technical errors. If the user enters an invalid password, you could send a user facing error back, like "Invalid password entered!". However, if due to some problem, say, a database error is thrown, you can't show it to the user. They won't get it.
  
Hence, whenever an `Error` is thrown inside a route body, `{"status":"failure","message":"Something went wrong! Please try again later."}` will **always** be sent back. Note that this is an **in-built feature**. You do not need to catch exceptions manually. Just throw it.
But then how do you send back a user facing error? The answer is `HyError`.

`HyError` is a class that extends `Error`, which should be thrown when a user facing error occurs. It takes three parameters + an optional parameter.
```typescript
throw new HyError(ErrorKind.BAD_REQUEST, "Invalid password!", TAG);
// {"status":"failure","message":"Invalid password!"}

throw new HyError(ErrorKind.BAD_REQUEST, "Invalid password!", TAG, { correctPassword: "12345" });
// {"status":"failure","message":"Invalid password!", "correctPassword": "12345"}
```
Here, the first argument is supposed to be a value from the object `ErrorKind`. The second argument is the message string, and the third argument is a 'tag', or the name of the file the error occured in. You could dynamically fetch this at the top of each file to make things easier. The fourth parameter is an optional object that will be added to the response. Good to include some extra data. `HyError` will be logged to the console if running in dev-mode.

## But what about routing?
Routing, or splitting routes into different files based on how they're related, is important. With Hyougen, you can use `getRoutedWrappedApp` to do this:
```typescript
export default (wapp: WrappedApp, root: string) {
  const app = getRoutedWrappedApp(wapp, root, ...middleware);
  
  app.get(...);
  ...
}
```
and then call it from your main/index file with the root wrapped app you obtained from `getWrappedApp`. Refer to the `examples` directory for an example.
You could also pass an optional fourth parameter to `getRoutedWrappedApp`, which is an array of middleware. That middleware will be applied to every route registered with that instance of `WrappedApp`. Note that the middleware declared here will be run BEFORE the middleware declared on routes.

And finally, you can also generate a makeshift documentation with no effort required using `app.saveApiDoc()`. Call it after you've registered all your routes, and a doc.md will be saved in the same folder. You can use `pandoc` to convert it into a PDF, and share it with the frontend dev or another member of your team, or use it yourself for a quick reference.

Hyougen is also available for [Deno](https://github.com/uditkarode/deno-hyougen)!
