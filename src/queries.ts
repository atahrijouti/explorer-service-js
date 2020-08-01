import { Errors } from "./response-middleware"
import { db } from "./database/db"

enum NodeType {
  FILE = "FILE",
  FOLDER = "FOLDER",
}

type ID = number | null

export type Node = {
  id: ID
  name: string
  type: NodeType
  parent_id: ID
}

export const rootFolder: Node = Object.freeze({
  id: null,
  name: "Home",
  type: NodeType.FOLDER,
  parent_id: null,
})

export async function storeNewNode(name: string, type: NodeType, parent_id: number) {
  // const suitableName = getSuitableName(name, type, parent_id)
  // const newlyCreatedNode = {
  //   id: nextId,
  //   name: suitableName,
  //   type,
  //   parent_id,
  // }
  // // dbTable.push(newlyCreatedNode)
  // nextId++
  //
  return await getSuitableName("New Folder", NodeType.FOLDER, parent_id)
}

export async function deleteNodes(ids: ID[]) {
  return db.query({
    text: `DELETE FROM nodes WHERE id in (${arrayParamAnnotations(ids)})`,
    values: ids,
  })
}

async function getSuitableName(name: string, nodeType: NodeType, parent_id: ID) {
  const parentClause = parent_id == null ? "parent_id is null" : "parent_id = $2"
  const values: any[] = [`^${name}( \\([0-9]+\\))?$`]
  parent_id != null && values.push(parent_id)

  console.log({ parentClause, values })

  const result = await db.query({
    text: `
select
   coalesce(
       max(
           cast(
               substring(name, '\\(([0-9]+)\\)') as integer
           )
       ),
       0
   )
   as copy_number
from nodes
where name ~* $1
  and ${parentClause}
group by name
order by copy_number desc
limit 1
`,
    values,
  })

  console.log(result.rows[0])
}

/**
 * Example : /Documents/CV/V1/Music
 * select n0.id, n1.id, n2.id, n3.id
 * from nodes n0
 * left join nodes as n1 on n0.id = n1.parent_id and n1.name = 'CV'
 * left join nodes as n2 on n1.id = n2.parent_id and n2.name = 'V1'
 * left join nodes as n3 on n2.id = n3.parent_id and n3.name = 'Music'
 * where n0.name = 'Documents' and n0.parent_id is null
 */
export async function findNodeFromPath(path: string) {
  const pathParts = path.split("/")
  const result = db.query({
    text: `
      select ${buildFromPathSelectIds(pathParts)}
      from nodes n0
      ${buildFromPathJoins(pathParts)}
      where n0.name = $1 and n0.parent_id is null
 `,
    values: pathParts,
    rowMode: "array",
  })
  const breadcrumbIds = (await result).rows[0]

  const breadcrumb = (
    await db.query({
      text: `SELECT * FROM nodes WHERE id in (${arrayParamAnnotations(breadcrumbIds)})`,
      values: breadcrumbIds,
    })
  ).rows

  return {
    breadcrumb: [rootFolder, ...breadcrumb],
    node: breadcrumb[breadcrumb.length - 1],
  }
}

/**
 * select n0.id, n1.id, n2.id, n3.id
 */
function buildFromPathSelectIds(pathParts: string[]) {
  return pathParts.map((_, index) => `n${index}.id`).join(", ")
}

/*
  left join nodes as n1 on n0.id = n1.parent_id and n1.name = 'CV'
  left join nodes as n2 on n1.id = n2.parent_id and n2.name = 'V1'
  left join nodes as n3 on n2.id = n3.parent_id and n3.name = 'Music'
 --
  left join nodes as n1 on n0.id = n1.parent_id and n1.name = $2
  left join nodes as n2 on n1.id = n2.parent_id and n2.name = $3
  left join nodes as n3 on n2.id = n3.parent_id and n3.name = $4
 */
function buildFromPathJoins(pathParts: string[]) {
  const [, ...omitFirst] = pathParts
  return omitFirst
    .map((_, i) => {
      const j = i + 1
      const p = j + 1
      return `left join nodes as n${j} on n${i}.id = n${j}.parent_id and n${j}.name = $${p}`
    })
    .join("\n")
}

export function findNodeById(id: ID) {
  return db
    .query({
      text: "SELECT * FROM nodes WHERE id = $1",
      values: [id],
    })
    .then((res) => res.rows[0])
}

async function findNodeChildren(id: ID) {
  return db
    .query({
      text: `SELECT * FROM nodes WHERE parent_id = $1`,
      values: [id],
    })
    .then((res) => res.rows)
}

async function findRootChildren() {
  return db
    .query({
      text: `SELECT * FROM nodes WHERE parent_id IS NULL`,
    })
    .then((res) => res.rows)
}

export async function getNodeAndChildren(id: ID) {
  if (id === rootFolder.id) {
    return {
      node: rootFolder,
      children: await findRootChildren(),
    }
  }
  //
  const node = await findNodeById(id)
  if (node == null) {
    return Errors.NOT_FOUND
  }
  return {
    node,
    children: await findNodeChildren(id),
  }
}

export async function renameNode(id: ID, name: string) {
  return db.query({
    text: "UPDATE nodes SET name = $1 WHERE id = $2",
    values: [name, id],
  })
}

let nextId = 14

export const dbTable: Node[] = [
  { id: 1, name: "Videos", type: NodeType.FOLDER, parent_id: null },
  { id: 2, name: "Pictures", type: NodeType.FOLDER, parent_id: null },
  { id: 3, name: "Documents", type: NodeType.FOLDER, parent_id: null },
  { id: 4, name: "Music", type: NodeType.FOLDER, parent_id: null },
  { id: 7, name: "New folder", type: NodeType.FOLDER, parent_id: null },
  { id: 8, name: "New folder (2)", type: NodeType.FOLDER, parent_id: null },
  { id: 5, name: "CV", type: NodeType.FOLDER, parent_id: 3 },
  { id: 6, name: "Amine Tirecht.pdf", type: NodeType.FILE, parent_id: 5 },
  { id: 9, name: "Hello world.txt", type: NodeType.FILE, parent_id: null },
  { id: 10, name: "How is it going.mp3", type: NodeType.FILE, parent_id: null },
  { id: 11, name: "desktop.ini", type: NodeType.FILE, parent_id: null },
  { id: 12, name: "random.atirecht", type: NodeType.FILE, parent_id: null },
  { id: 13, name: "V1", type: NodeType.FOLDER, parent_id: 5 },
]

function arrayParamAnnotations(array: any[]) {
  return array.map((_, i) => `$${i + 1}`).join(",")
}
