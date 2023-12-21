<template>
  <WideLayout>
    <h1>Test Drag and Drop Page</h1>

    <Table>
      <colgroup>
        <col />
        <col class="tw-w-48" />
        <col class="tw-w-48" />
      </colgroup>
      <THead>
        <Tr>
          <Th>Person</Th>
          <Th>Fall</Th>
          <Th>Spring</Th>
        </Tr>
      </THead>
      <TBody>
        <Tr>
          <Td>Abby</Td>
          <Td>
            <div class="tw-w-full tw-h-full">
              <DragDrop
                id="abby-fall"
                :list="courseHist.abby.fall"
                class="tw-flex tw-flex-col tw-gap-1"
              >
                <template #item="{ element }">
                  <div
                    class="tw-rounded tw-p-8 tw-border tw-border-blue-800 tw-bg-blue-100"
                  >
                    {{ element.id }}
                  </div>
                </template>
              </DragDrop>
            </div>
          </Td>
          <Td>
            <DragDrop
              id="abby-spring"
              :list="courseHist.abby.spring"
              class="tw-flex tw-flex-col tw-gap-1"
            >
              <template #item="{ element }">
                <div
                  class="tw-rounded tw-p-2 tw-border tw-border-blue-800 tw-bg-blue-100"
                >
                  {{ element.id }}
                </div>
              </template>
            </DragDrop>
          </Td>
        </Tr>
        <!-- <Tr>
          <Td>Bob</Td>
          <Td>5</Td>
          <Td>6</Td>
        </Tr>
        <Tr>
          <Td>Charlie</Td>
          <Td>8</Td>
          <Td>9</Td>
        </Tr> -->
      </TBody>
    </Table>
  </WideLayout>
</template>
<script setup lang="ts">
import { reactive } from "vue";
import { Table, Td, Th, TBody, Tr, THead } from "@/components/Table";
import WideLayout from "@/layouts/WideLayout.vue";
import { DragDrop } from "@/components/DragDrop";

const courseHist = reactive({
  abby: {
    fall: [{ id: "HIST-1001" }, { id: "HIST-1002" }, { id: "HIST-1003" }],
    spring: [],
  },
  // bob: {
  //   fall: [],
  //   spring: [],
  // },
  // charlie: {
  //   fall: [],
  //   spring: [],
  // },
});
</script>
<style scoped></style>
