import { Client } from "pg"
import { config } from "../config"

export const db = new Client({
  host: config.DB_HOST,
  database: config.DB_DATABASE,
  port: Number(config.DB_PORT),
  user: config.DB_USER,
  password: config.DB_PASSWORD,
})

db.connect()
