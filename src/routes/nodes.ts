import Router from "@koa/router"
import { deleteNodes, findNodeFromPath, getNodeAndChildren, storeNewNode } from "../queries"

export const router = new Router()

router.get("/root-nodes", async (ctx) => {
  ctx.body = await getNodeAndChildren(null)
})

router.get("/nodes/:id", async (ctx) => {
  ctx.body = await getNodeAndChildren(Number(ctx.params.id))
})

router.post("/nodes", (ctx) => {
  const body = ctx.request.body
  ctx.body = storeNewNode(body.name, body.type, body.parentId)
})

router.del("/nodes", async (ctx) => {
  await deleteNodes(ctx.request.body.ids)
  ctx.status = 204
})

router.get("/nodes-from-path/:path(.*)", (ctx) => {
  ctx.body = findNodeFromPath(ctx.params.path)
})
