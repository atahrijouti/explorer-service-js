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

export async function storeNewNode(type: NodeType, parent_id: number) {
  const newNodeBaseName = type == NodeType.FOLDER ? "New folder" : "New file"
  const nextCopyName = await getNextCopyName(newNodeBaseName, type, parent_id)

  const result = await db.query({
    text: `
    INSERT INTO nodes (name, type, parent_id)
    VALUES ($1, $2, $3)
    RETURNING *
  `,
    values: [nextCopyName, type, parent_id],
  })
  return result.rows[0]
}

export async function deleteNodes(ids: ID[]) {
  return db.query({
    text: `DELETE FROM nodes WHERE id in (${arrayParamAnnotations(ids)})`,
    values: ids,
  })
}

async function getNextCopyName(baseName: string, nodeType: NodeType, parent_id: ID) {
  const parentClause = parent_id == null ? "parent_id is null" : "parent_id = $2"
  const values: any[] = [`^${baseName}( \\([0-9]+\\))?$`]
  parent_id != null && values.push(parent_id)

  const result = await db.query({
    text: `
select
   coalesce(
       max(
           cast(
               substring(name, '\\(([0-9]+)\\)') as integer
           )
       ),
       1
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

  const maxCopyNumber = result.rows[0]?.copy_number ?? 0

  if (maxCopyNumber === 0) {
    return baseName
  } else {
    return `${baseName} (${maxCopyNumber + 1})`
  }
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
  const result = await db.query({
    text: `
      select ${buildFromPathSelectIds(pathParts)}
      from nodes n0
      ${buildFromPathJoins(pathParts)}
      where n0.name = $1 and n0.parent_id is null
 `,
    values: pathParts,
    rowMode: "array",
  })
  const breadcrumbIds = result.rows[0]

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

function arrayParamAnnotations(array: any[]) {
  return array.map((_, i) => `$${i + 1}`).join(",")
}
