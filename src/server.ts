import Koa from "koa"
import Router from "@koa/router"

const HTTP_PORT = 8000

const app = new Koa()
const router = new Router()

router.get("/", (ctx) => {
  ctx.body = {
    id: 1,
    name: "documents",
    type: "FOLDER",
    parentId: null
  }
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(HTTP_PORT)

console.log(`Server started on http://localhost:${HTTP_PORT}`)
