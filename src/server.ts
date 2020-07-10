import Koa from "koa"
import Router from "@koa/router"

const HTTP_PORT = 8000
const app = new Koa()
const router = new Router()

router.get("/", (ctx, next) => {
  ctx.body = {
    lol: 1,
  }
})

app.use(router.routes())

app.listen(HTTP_PORT)
