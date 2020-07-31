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

router.post("/nodes", (ctx) => {
  const { name, type, parentId } = ctx.request.body
  ctx.body = storeNewNode(name, type, parentId)
})

router.put("/nodes/:id", async (ctx) => {
  const { name } = ctx.request.body
  ctx.body = await renameNode(ctx.params.id, name)
  ctx.status = 204
})

router.del("/nodes", async (ctx) => {
  await deleteNodes(ctx.request.body.ids)
  ctx.status = 204
})

router.get("/nodes-from-path/:path(.*)", async (ctx) => {
  ctx.body = await findNodeFromPath(ctx.params.path)
})
