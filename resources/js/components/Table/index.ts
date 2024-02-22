import { Exposed as TableExposed } from "./Table.vue";
// import separately so that we can use in the TableType definition
import Table from "./Table.vue";

export { Table };
export { default as TBody } from "./TBody.vue";
export { default as THead } from "./THead.vue";
export { default as Tr } from "./Tr.vue";
export { default as Th } from "./Th.vue";
export { default as Td } from "./Td.vue";

export type TableType = InstanceType<typeof Table> & TableExposed;
