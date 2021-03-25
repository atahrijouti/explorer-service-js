import Koa from "koa"
import cors from "@koa/cors"
import bodyParser from "koa-bodyparser"

import { errorMiddleware } from "./response-middleware"
import { router } from "./routes/nodes"

const HTTP_PORT = 8000

const app = new Koa()

app.use(cors())
app.use(bodyParser())
app.use(errorMiddleware)
app.use(router.routes()).use(router.allowedMethods())
app.listen(HTTP_PORT)

console.log(`Server started on http://localhost:${HTTP_PORT}`)
