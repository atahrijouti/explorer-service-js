import Koa from "koa"

export enum Errors {
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
}

export async function errorMiddleware(ctx: Koa.Context, next: Function) {
  await next()
  const body = ctx.body
  switch (body) {
    case Errors.NOT_FOUND:
      ctx.status = 404
      ctx.body = { error: "Not Found :-(" }
      break
    case Errors.DUPLICATE_ENTRY:
      ctx.status = 409
      ctx.body = { error: "Duplicate Entry ::--((" }
      break
    default:
  }
}
