import Router from "@koa/router"
import {
  deleteNodes,
  findNodeFromPath,
  getNodeAndChildren,
  renameNode,
  storeNewNode,
} from "../queries"

export const router = new Router()

router.get("/root-nodes", async (ctx) => {
  ctx.body = await getNodeAndChildren(null)
})

router.get("/nodes/:id", async (ctx) => {
  ctx.body = await getNodeAndChildren(Number(ctx.params.id))
})

router.post("/nodes", async (ctx) => {
  const { type, parent_id } = ctx.request.body
  ctx.body = await storeNewNode(type, parent_id)
})

router.put("/nodes/:id", async (ctx) => {
  const { name } = ctx.request.body
  ctx.status = 200
  ctx.body = await renameNode(ctx.params.id, name)
})

router.del("/nodes", async (ctx) => {
  ctx.status = 204
  await deleteNodes(ctx.request.body.ids)
})

router.get("/nodes-from-path/:path(.*)", async (ctx) => {
  ctx.body = await findNodeFromPath(ctx.params.path)
})
