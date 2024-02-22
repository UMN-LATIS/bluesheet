import * as T from '@/types'
import * as stores from '../../stores';

interface PersonTableEnrollmentRecord {
  courseId: T.CourseShortCode;
  title: T.Course['title'];
  courseType: T.Course['courseType'];
  courseLevel: T.Course['courseLevel'];
  classSection: T.CourseSection['classSection'];
  enrollmentCap: T.CourseSection['enrollmentCap'];
  enrollmentTotal: T.CourseSection['enrollmentTotal'];
  isCancelled: T.CourseSection['isCancelled'];
  isPublished: T.CourseSection['isPublished'];
  enrollmentRole: T.Enrollment['role'];
}
interface PersonTableTermRecord {
  id: T.Term['id'];
  term: T.Term;
  enrollments: PersonTableEnrollmentRecord[];
  leaves: T.Leave[];
}

interface PersonTableRecord {
  id: T.Person['emplid'];
  person: T.Person;
  termRecords: PersonTableTermRecord[];
}

const personStore = stores.usePersonStore();
const enrollmentStore = stores.useEnrollmentStore();
const leaveStore = stores.useLeaveStore();
const courseStore = stores.useCourseStore();
const courseSectionStore = stores.useCourseSectionStore();
const termStore = stores.useTermStore();

function getSectionsForEmplIdInTerm(emplId: T.Person["emplid"], termId: number) {
  const sections = courseSectionStore.getSectionsByEmplId(emplId);
  return sections.filter((section) => section.termId === termId);
}

function getLeavesForPersonInTerm(emplId: T.Person["emplid"], termId: number) {
  return leaveStore.getLeavesByPersonId(emplId).filter((leave) => leave.termIds?.includes(termId));
}


export function usePersonTableData(): PersonTableRecord[] {
  return personStore.allPeople.map((person) => {
    const termRecords: PersonTableTermRecord[] = termStore.sortedTerms.map((term) =>{
      const leaves = getLeavesForPersonInTerm(person.emplid, term.id);
      const sections = getSectionsForEmplIdInTerm(person.emplid, term.id);
      const enrollments = sections.map((section) => {
        const course = courseStore.getCourse(section.courseId);
        if (!course) {
          throw new Error(`Course not found for section ${section.id}`);
        }

        const enrollment = enrollmentStore.getEnrollmentForPersonInSection(person, section);

        if (!enrollment) {
          throw new Error(`Enrollment not found for person ${person.emplid} in section ${section.id}`);
        }

        const enrollmentRecord: PersonTableEnrollmentRecord = {
          courseId: section.courseId,
          title: course.title,
          courseType: course.courseType,
          courseLevel: course.courseLevel,
          classSection: section.classSection,
          enrollmentCap: section.enrollmentCap,
          enrollmentTotal: section.enrollmentTotal,
          isCancelled: section.isCancelled,
          isPublished: section.isPublished,
          enrollmentRole:enrollment.role,
        };
        return enrollmentRecord;
      });

      return {
        id: term.id,
        leaves,
        term,
        enrollments,
      }

    })

    const record: PersonTableRecord = {
      id: person.emplid,
      person,
      termRecords,
    };

    return record;
  });
}
