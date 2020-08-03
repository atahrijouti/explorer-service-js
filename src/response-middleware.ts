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
      ctx.throw(404, "Not Found :-(")
      break
    case Errors.DUPLICATE_ENTRY:
      ctx.throw(409, "Duplicate Entry ::--((")
      break
    default:
  }
}
