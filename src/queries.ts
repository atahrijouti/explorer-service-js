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
  parentId: ID
}

export const rootFolder: Node = Object.freeze({
  id: null,
  name: "Home",
  type: NodeType.FOLDER,
  parentId: null,
})

export function storeNewNode(name: string, type: NodeType, parentId: number) {
  const suitableName = getSuitableName(name, type, parentId)
  const newlyCreatedNode = {
    id: nextId,
    name: suitableName,
    type,
    parentId,
  }
  dbTable.push(newlyCreatedNode)
  nextId++

  return newlyCreatedNode
}

export async function deleteNodes(ids: ID[]) {
  return db.query({
    text: `DELETE FROM nodes WHERE id in (${arrayParamAnnotations(ids)})`,
    values: ids,
  })
}

function getSuitableName(newName: string, nodeType: NodeType, parentId: ID) {
  const regex = new RegExp(`^${newName}(?: \\(([0-9]*)\\))?$`)

  const suffix = dbTable.reduce<number | null>((max, node) => {
    const matches = node.name.match(regex)

    // if we find a matching name in the current folder & same type
    if (node.parentId === parentId && matches !== null && node.type === nodeType) {
      // if we still haven't found a max then use  "${newName} (2)"
      if (node.name === newName && max === null) {
        return 2
      }

      const nextNumber = Number(matches[1]) + 1

      // if no max but we have a match with a number, use nextNumber
      if (max === null) {
        return nextNumber
      } else {
        // if nextNumber bigger than max, use nextNumber
        if (nextNumber > max) {
          return nextNumber
        }
      }
    }

    return max
  }, null)

  return `${newName}${suffix ? ` (${suffix})` : ""}`
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
  { id: 1, name: "Videos", type: NodeType.FOLDER, parentId: null },
  { id: 2, name: "Pictures", type: NodeType.FOLDER, parentId: null },
  { id: 3, name: "Documents", type: NodeType.FOLDER, parentId: null },
  { id: 4, name: "Music", type: NodeType.FOLDER, parentId: null },
  { id: 7, name: "New folder", type: NodeType.FOLDER, parentId: null },
  { id: 8, name: "New folder (2)", type: NodeType.FOLDER, parentId: null },
  { id: 5, name: "CV", type: NodeType.FOLDER, parentId: 3 },
  { id: 6, name: "Amine Tirecht.pdf", type: NodeType.FILE, parentId: 5 },
  { id: 9, name: "Hello world.txt", type: NodeType.FILE, parentId: null },
  { id: 10, name: "How is it going.mp3", type: NodeType.FILE, parentId: null },
  { id: 11, name: "desktop.ini", type: NodeType.FILE, parentId: null },
  { id: 12, name: "random.atirecht", type: NodeType.FILE, parentId: null },
  { id: 13, name: "V1", type: NodeType.FOLDER, parentId: 5 },
]

function arrayParamAnnotations(array: any[]) {
  return array.map((_, i) => `$${i + 1}`).join(",")
}
