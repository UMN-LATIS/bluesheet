<template>
  <DefaultLayout>
    <h1>Leaves Planning Report</h1>

    <p>Count of leaves planned for each department within a given semester.</p>

    <Table>
      <THead>
        <Tr>
          <Th>Departments</Th>
          <Th>Fall 2019</Th>
        </Tr>
      </THead>
      <TBody>
        <Tr>
          <Td>Department 1</Td>
          <Td>10</Td>
        </Tr>
        <Tr>
          <Td>Department 2</Td>
          <Td>20</Td>
        </Tr>
        <Tr>
          <Td>Department 3</Td>
          <Td>30</Td>
        </Tr>
      </TBody>
    </Table>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/Table";
</script>
<style scoped></style>
