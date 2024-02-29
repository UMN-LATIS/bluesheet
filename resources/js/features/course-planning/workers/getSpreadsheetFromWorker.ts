import * as T from "@/types";
import { cloneDeep } from "lodash";
import ViteWorker from "@/utils/ViteWorker";
import coursePlanningWorkerURL from "./coursePlanningWorker?worker&url";
import { useCoursePlanningStore } from "../stores";
import { serializedCoursePlanningFilters } from "../helpers/serializedCoursePlanningFilters";
import * as MESSAGE_TYPES from "./messageTypes";

type SpreadsheetRequestType =
  | typeof MESSAGE_TYPES.INSTRUCTOR_SPREADSHEET_REQUEST
  | typeof MESSAGE_TYPES.COURSES_SPREADSHEET_REQUEST
  | typeof MESSAGE_TYPES.TA_SPREADSHEET_REQUEST;

export function getSpreadsheetFromWorker(
  requestType: SpreadsheetRequestType,
): Promise<T.PersonSpreadsheetRowRecord[] | T.CourseSpreadsheetRowRecord[]> {
  const coursePlanningStore = useCoursePlanningStore();

  return new Promise((resolve, reject) => {
    const worker = new ViteWorker(coursePlanningWorkerURL);
    const lookups = cloneDeep(coursePlanningStore.getCoursePlanningLookups());
    const filters = coursePlanningStore.getCoursePlanningFilters();
    const serializedFilters = serializedCoursePlanningFilters(filters);

    worker.addEventListener("message", (event) => {
      const { payload, error, type } = (event as MessageEvent).data;

      if (type.includes("SUCCESS")) {
        resolve(payload ?? []);
      }

      if (type.includes("FAILURE")) {
        console.error(error);
        reject(error);
      }

      if (type === MESSAGE_TYPES.INVALID_MESSAGE_TYPE) {
        console.error(error);
        reject(error);
      }

      worker.terminate();
      worker.removeAllEventListeners();
    });

    worker.postMessage({
      type: requestType,
      payload: {
        lookups,
        serializedFilters,
      },
    });
  });
}
