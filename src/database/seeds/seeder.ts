import { db } from "../db"

const query = `
INSERT INTO nodes (id, name, type, parent_id)
VALUES (1, 'Videos', 'FOLDER', null),
       (2, 'Pictures', 'FOLDER', null),
       (3, 'Documents', 'FOLDER', null),
       (4, 'Music', 'FOLDER', null),
       (7, 'New folder', 'FOLDER', null),
       (8, 'New folder (2)', 'FOLDER', null),
       (5, 'CV', 'FOLDER', 3),
       (6, 'Amine Tirecht.pdf', 'FILE', 5),
       (9, 'Hello world.txt', 'FILE', null),
       (10, 'How is it going.mp3', 'FILE', null),
       (11, 'desktop.ini', 'FILE', null),
       (12, 'random.atirecht', 'FILE', null),
       (13, 'V1', 'FOLDER', 5);
  `

const update_sequence = "ALTER SEQUENCE nodes_id_seq RESTART WITH 14"

//// add default seed stuff
;(async function () {
  await db.query(query)
  await db.query(update_sequence)
  await db.end()
  process.exit(0)
})()
