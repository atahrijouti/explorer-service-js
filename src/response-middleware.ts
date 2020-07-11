import Koa from "koa"

export enum Errors {
  NOT_FOUND = "NOT_FOUND",
}

export async function errorMiddleware(ctx: Koa.Context, next: Function) {
  await next()
  const body = ctx.body
  switch (body) {
    case Errors.NOT_FOUND:
      ctx.throw(404, "Not Found :-(")
      break
    default:
  }
}
