import * as T from "@/types";
import {
  useCourseSectionStore,
  useCourseStore,
  useEnrollmentStore,
  useLeaveStore,
  usePersonStore,
  useTermStore,
  useRootCoursePlanningStore,
} from "../../stores";
import { getPersonTableRows } from "./getPersonTableRows";
import { getCourseTableRows } from "./getCourseTableRows";

interface CoursePlanningServiceDependencies {
  courseSectionStore?: ReturnType<typeof useCourseSectionStore>;
  courseStore?: ReturnType<typeof useCourseStore>;
  enrollmentStore?: ReturnType<typeof useEnrollmentStore>;
  leaveStore?: ReturnType<typeof useLeaveStore>;
  personStore?: ReturnType<typeof usePersonStore>;
  termStore?: ReturnType<typeof useTermStore>;
  filterStore?: ReturnType<typeof useRootCoursePlanningStore>;
}

export class CoursePlanningService {
  private courseSectionStore: ReturnType<typeof useCourseSectionStore>;
  private courseStore: ReturnType<typeof useCourseStore>;
  private enrollmentStore: ReturnType<typeof useEnrollmentStore>;
  private leaveStore: ReturnType<typeof useLeaveStore>;
  private personStore: ReturnType<typeof usePersonStore>;
  private termStore: ReturnType<typeof useTermStore>;
  private filterStore: ReturnType<typeof useRootCoursePlanningStore>;

  constructor({
    courseSectionStore = useCourseSectionStore(),
    courseStore = useCourseStore(),
    enrollmentStore = useEnrollmentStore(),
    leaveStore = useLeaveStore(),
    personStore = usePersonStore(),
    termStore = useTermStore(),
    filterStore = useRootCoursePlanningStore(),
  }: CoursePlanningServiceDependencies) {
    this.courseSectionStore = courseSectionStore;
    this.courseStore = courseStore;
    this.enrollmentStore = enrollmentStore;
    this.leaveStore = leaveStore;
    this.personStore = personStore;
    this.termStore = termStore;
    this.filterStore = filterStore;
  }

  private getLookups() {
    return {
      personLookup: this.personStore.personLookupByEmpId,
      termLookup: this.termStore.termLookup,
      courseLookup: this.courseStore.courseLookup,
      sectionLookup: this.courseSectionStore.sectionLookup,
      enrollmentLookup: this.enrollmentStore.enrollmentLookup,
      leaveLookup: this.leaveStore.leaveLookup,
    };
  }

  getInstructorTableRows() {
    const lookups = this.getLookups();
    return getPersonTableRows({
      lookups,
      filters: {
        ...this.filterStore.filters,
        excludedEnrollmentRoles: new Set(["TA"]),
        inPlanningMode: this.filterStore.isInPlanningMode,
      },
    });
  }

  getTATableRows() {
    const lookups = this.getLookups();
    return getPersonTableRows({
      lookups,
      filters: {
        ...this.filterStore.filters,
        excludedEnrollmentRoles: new Set(["PI"]),
        inPlanningMode: this.filterStore.isInPlanningMode,
      },
    });
  }

  getCourseTableRows() {
    const lookups = this.getLookups();
    return getCourseTableRows({
      lookups,
      filters: {
        ...this.filterStore.filters,
        inPlanningMode: this.filterStore.isInPlanningMode,
      },
    });
  }
}
