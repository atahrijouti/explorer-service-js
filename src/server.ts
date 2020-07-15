import Koa from "koa"
import Router from "@koa/router"
import bodyParser from "koa-bodyparser"
import { deleteNodes, findNodeFromPath, getNodeAndChildren, storeNewNode } from "./queries"
import { errorMiddleware } from "./response-middleware"

const HTTP_PORT = 8000

const app = new Koa()
const router = new Router()

router.get("/root-nodes", (ctx) => {
  ctx.body = getNodeAndChildren(null)
})

router.get("/nodes/:id", (ctx) => {
  ctx.body = getNodeAndChildren(Number(ctx.params.id))
})

router.post("/nodes", (ctx) => {
  const body = ctx.request.body
  ctx.body = storeNewNode(body.name, body.type, body.parentId)
})

router.del("/nodes", (ctx) => {
  deleteNodes(ctx.request.body.ids)
  ctx.status = 204;
})

router.get("/nodes-from-path/:path(.*)", (ctx) => {
  ctx.body = findNodeFromPath(ctx.params.path)
})

app.use(errorMiddleware)
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods())
app.listen(HTTP_PORT)

console.log(`Server started on http://localhost:${HTTP_PORT}`)
