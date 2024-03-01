import * as T from "@/types";
import { getPersonSpreadsheetRecords } from "../helpers/getPersonSpreadsheetRecords";
import { deserializeCoursePlanningFilters } from "../helpers/serializedCoursePlanningFilters";
import * as MESSAGE_TYPES from "./messageTypes";
import { getCourseSpreadsheetRecords } from "../helpers/getCourseSpreadsheetRecords";

export interface CoursePlanningData {
  lookups: T.CoursePlanningLookups;
  serializedFilters: T.SerializedCoursePlanningFilters;
}

export interface WorkerMessage<TPayload = unknown, TError = string> {
  type: keyof typeof MESSAGE_TYPES;
  payload?: TPayload;
  error?: TError;
}

const requestHandlers = {
  [MESSAGE_TYPES.INSTRUCTOR_SPREADSHEET_REQUEST]: ({
    lookups,
    serializedFilters,
  }: CoursePlanningData) => {
    const filters = deserializeCoursePlanningFilters(serializedFilters);
    return getPersonSpreadsheetRecords({
      lookups,
      filters: {
        ...filters,
        includedEnrollmentRoles: new Set(["PI"]),
      },
    });
  },

  [MESSAGE_TYPES.TA_SPREADSHEET_REQUEST]: ({
    lookups,
    serializedFilters,
  }: CoursePlanningData) => {
    const filters = deserializeCoursePlanningFilters(serializedFilters);
    return getPersonSpreadsheetRecords({
      lookups,
      filters: {
        ...filters,
        includedEnrollmentRoles: new Set(["TA"]),
      },
    });
  },
  [MESSAGE_TYPES.COURSES_SPREADSHEET_REQUEST]: ({
    lookups,
    serializedFilters,
  }: CoursePlanningData) => {
    const filters = deserializeCoursePlanningFilters(serializedFilters);
    return getCourseSpreadsheetRecords({ lookups, filters });
  },
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

  const requestHandler = requestHandlers[type];

  if (!requestHandler) {
    self.postMessage({
      type: MESSAGE_TYPES.INVALID_MESSAGE_TYPE,
      error: `Unknown message type: ${type}`,
    });
    return;
  }

  try {
    const response = await requestHandler(payload);
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
