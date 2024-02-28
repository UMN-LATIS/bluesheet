// import * as T from "@/types";
// import {
//   getLeavesInTerm,
//   getEnrollmentsForCourseInTerm,
//   getLeavesRow,
//   getCourseRows,
// } from "./useCourseTableData";
// import { createMockLookups } from "../../stores/createMockLookups";

// describe("getCourseTableRows", () => {
//   it("get leaves in a given term", () => {
//     const lookups = createMockLookups();
//     const term = lookups.termLookup[1];
//     const leaves = getLeavesInTerm({
//       leaveLookup: lookups.leaveLookup,
//       term,
//     });
//     expect(leaves).toMatchInlineSnapshot(`
//       [
//         {
//           "created_at": "2021-08-01",
//           "description": "Sabbatical",
//           "end_date": "2021-12-31",
//           "id": 1,
//           "start_date": "2021-08-01",
//           "status": "confirmed",
//           "termIds": [
//             1,
//           ],
//           "type": "sabbatical",
//           "updated_at": "2021-08-01",
//           "user_id": 210,
//         },
//       ]
//     `);
//   });

//   it("gets a list of joined enrollment records for a course in a given term", () => {
//     const lookups = createMockLookups();

//     const courseId = "AFRO-1009";
//     const termId = 1; // Fall 2021
//     const course = lookups.courseLookup[courseId];
//     const term = lookups.termLookup[termId];

//     const joinedEnrollments: T.JoinedEnrollmentRecord[] =
//       getEnrollmentsForCourseInTerm({
//         course,
//         term,
//         ...lookups,
//       });

//     expect(joinedEnrollments.length).toBe(2);
//     expect(joinedEnrollments[0].course.id).toBe(courseId);
//     expect(joinedEnrollments[0].term.id).toBe(termId);
//     expect(joinedEnrollments[0].person.emplid).toBe(12345);
//     expect(joinedEnrollments[0].section.id).toBe("sis-39");
//     expect(joinedEnrollments[0].enrollment.id).toBe("sis-sis-39-12345");
//   });

//   it("should get a leave row", () => {
//     const lookups = createMockLookups();
//     const [leaveRowLabel, ...termLeaves] = getLeavesRow({ lookups });
//     expect(leaveRowLabel).toBe("leaves");
//     expect(termLeaves.length).toBe(2);
//     expect(termLeaves[0].term.id).toBe(1);
//     expect(termLeaves[0]).toMatchInlineSnapshot(`
//       {
//         "leaves": [
//           {
//             "created_at": "2021-08-01",
//             "description": "Sabbatical",
//             "end_date": "2021-12-31",
//             "id": 1,
//             "start_date": "2021-08-01",
//             "status": "confirmed",
//             "termIds": [
//               1,
//             ],
//             "type": "sabbatical",
//             "updated_at": "2021-08-01",
//             "user_id": 210,
//           },
//         ],
//         "term": {
//           "endDate": "2021-12-31",
//           "id": 1,
//           "name": "Fall 2021",
//           "startDate": "2021-08-01",
//         },
//       }
//     `);
//   });

//   it("should get the course rows", () => {
//     const lookups = createMockLookups();
//     const courseRows = getCourseRows({ lookups });
//     expect(courseRows.length).toBe(2);
//     const [course, ...termsWithJoinedEnrollments] = courseRows[0];
//     expect(course.id).toBe("AFRO-1009");
//     expect(termsWithJoinedEnrollments.length).toBe(2);
//     const { term, joinedEnrollments } = termsWithJoinedEnrollments[0];
//     expect(term.id).toBe(1);
//     expect(joinedEnrollments.length).toBe(2);
//     expect(joinedEnrollments[0].course).toMatchInlineSnapshot(`
//       {
//         "catalogNumber": "1009",
//         "courseCode": "AFRO-1009",
//         "courseLevel": "UGRD",
//         "courseType": "LEC",
//         "id": "AFRO-1009",
//         "source": "sis",
//         "subject": "AFRO",
//         "title": "History of Women in Africa",
//       }
//     `);
//     expect(joinedEnrollments[0].term).toMatchInlineSnapshot(`
//       {
//         "endDate": "2021-12-31",
//         "id": 1,
//         "name": "Fall 2021",
//         "startDate": "2021-08-01",
//       }
//     `);
//     expect(joinedEnrollments[0].person).toMatchInlineSnapshot(`
//       {
//         "academicAppointment": "Faculty",
//         "displayName": "Dade Murphy",
//         "email": "dmurphy1234@umn.edu",
//         "emplid": 12345,
//         "givenName": "Dade",
//         "id": 210,
//         "jobCode": "9402",
//         "leaveIds": [
//           1,
//           2,
//         ],
//         "midcareerEligible": false,
//         "sslApplyEligible": true,
//         "sslEligible": true,
//         "surName": "Murphy",
//         "title": "Associate Professor",
//       }
//     `);
//     expect(joinedEnrollments[0].section).toMatchInlineSnapshot(`
//       {
//         "classNumber": 39,
//         "classSection": "001",
//         "courseId": "AFRO-1009",
//         "dbId": null,
//         "enrollmentCap": 18,
//         "enrollmentTotal": 16,
//         "groupId": 1,
//         "id": "sis-39",
//         "isCancelled": false,
//         "isPublished": true,
//         "termId": 1,
//         "waitlistCap": 0,
//         "waitlistTotal": 0,
//       }
//     `);
//     expect(joinedEnrollments[0].enrollment).toMatchInlineSnapshot(`
//       {
//         "dbId": null,
//         "emplid": 12345,
//         "id": "sis-sis-39-12345",
//         "role": "PI",
//         "sectionId": "sis-39",
//       }
//     `);
//   });
// });
