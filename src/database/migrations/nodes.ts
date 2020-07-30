import { db } from "../db"

export const query = `
create type node_type as enum ('FILE', 'FOLDER');
create table nodes
(
	id serial not null
		constraint table_name_pk
			primary key,
	name varchar(250),
	type node_type,
	parent_id integer
		constraint nodes_nodes_id_fk
			references nodes
				on delete cascade
				deferrable initially deferred
);
`

////
;(async function () {
  await db.query(query)
  await db.end()
  process.exit(0)
})()
