import * as T from "@/types";
import { getPersonTableRows } from "../helpers/getPersonTableRows";
import { getCourseTableRows } from "../helpers/getCourseTableRows";
import { getListOfTermLeaves } from "../helpers/getListOfTermLeaves";
import { deserializeCoursePlanningFilters } from "../helpers/serializedCoursePlanningFilters";

export const MESSAGE_TYPES = {
  INSTRUCTOR_TABLE_REQUEST: "INSTRUCTOR_TABLE_REQUEST",
  INSTRUCTOR_TABLE_SUCCESS: "INSTRUCTOR_TABLE_SUCCESS",
  INSTRUCTOR_TABLE_FAILURE: "INSTRUCTOR_TABLE_FAILURE",
  TA_TABLE_REQUEST: "TA_TABLE_REQUEST",
  TA_TABLE_SUCCESS: "TA_TABLE_SUCCESS",
  TA_TABLE_FAILURE: "TA_TABLE_FAILURE",
  COURSES_TABLE_REQUEST: "COURSES_TABLE_REQUEST",
  COURSES_TABLE_SUCCESS: "COURSES_TABLE_SUCCESS",
  COURSES_TABLE_FAILURE: "COURSES_TABLE_FAILURE",
  LIST_OF_TERM_LEAVES_REQUEST: "LIST_OF_TERM_LEAVES_REQUEST",
  LIST_OF_TERM_LEAVES_SUCCESS: "LIST_OF_TERM_LEAVES_SUCCESS",
  LIST_OF_TERM_LEAVES_FAILURE: "LIST_OF_TERM_LEAVES_FAILURE",
  INVALID_MESSAGE_TYPE: "INVALID_MESSAGE_TYPE",
} as const;

export interface CoursePlanningData {
  lookups: T.CoursePlanningLookups;
  serializedFilters: T.SerializedCoursePlanningFilters;
}

export interface WorkerMessage<TPayload = unknown, TError = string> {
  type: keyof typeof MESSAGE_TYPES;
  payload?: TPayload;
  error?: TError;
}

const messageHandlers = {
  [MESSAGE_TYPES.INSTRUCTOR_TABLE_REQUEST]: ({
    lookups,
    serializedFilters,
  }: CoursePlanningData) => {
    const filters = deserializeCoursePlanningFilters(serializedFilters);
    return getPersonTableRows({
      lookups,
      filters: {
        ...filters,
        includedEnrollmentRoles: new Set(["PI"]),
      },
    });
  },

  // [MESSAGE_TYPES.TA_TABLE_REQUEST]: ({
  //   lookups,
  //   filters,
  // }: CoursePlanningData) => {
  //   return getPersonTableRows({
  //     lookups,
  //     filters: {
  //       ...filters,
  //       includedEnrollmentRoles: new Set(["TA"]),
  //     },
  //   });
  // },
  // [MESSAGE_TYPES.COURSES_TABLE_REQUEST]: ({
  //   lookups,
  //   filters,
  // }: CoursePlanningData) => {
  //   return getCourseTableRows({ lookups, filters });
  // },
  // [MESSAGE_TYPES.LIST_OF_TERM_LEAVES_REQUEST]: ({
  //   lookups,
  //   filters,
  // }: CoursePlanningData) => {
  //   return getListOfTermLeaves({ lookups, filters });
  // },
};

function getFailureMessageType(
  messageType: keyof typeof MESSAGE_TYPES,
): keyof typeof MESSAGE_TYPES {
  return messageType.replace(
    "REQUEST",
    "FAILURE",
  ) as keyof typeof MESSAGE_TYPES;
}

function getSuccessMessageType(
  messageType: keyof typeof MESSAGE_TYPES,
): keyof typeof MESSAGE_TYPES {
  return messageType.replace(
    "REQUEST",
    "SUCCESS",
  ) as keyof typeof MESSAGE_TYPES;
}

self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  const messageHandler = messageHandlers[type];

  if (!messageHandler) {
    self.postMessage({
      type: MESSAGE_TYPES.INVALID_MESSAGE_TYPE,
      error: `Unknown message type: ${type}`,
    });
    return;
  }

  try {
    const response = await messageHandler(payload);
    self.postMessage({
      type: getSuccessMessageType(type),
      payload: response,
    });
  } catch (error) {
    self.postMessage({
      type: getFailureMessageType(type),
      error: (error as Error).message,
    });
  }
});
