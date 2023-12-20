<template>
  <WideLayout>
    <h1>Test Drag and Drop Page</h1>

    <Table>
      <TBody>
        <Tr>
          <Td>1</Td>
          <Td>2</Td>
          <Td>3</Td>
        </Tr>
        <Tr>
          <Td>4</Td>
          <Td>5</Td>
          <Td>6</Td>
        </Tr>
        <Tr>
          <Td>7</Td>
          <Td>8</Td>
          <Td>9</Td>
        </Tr>
      </TBody>
    </Table>
  </WideLayout>
</template>
<script setup lang="ts">
import { Table, Td, Th, TBody, Tr } from "@/components/Table";
import WideLayout from "@/layouts/WideLayout.vue";
</script>
<style scoped></style>
