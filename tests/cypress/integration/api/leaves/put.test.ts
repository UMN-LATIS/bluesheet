import * as api from "../../../support/api";

const validLeave = {
  description: "New leave",
  start_date: "2021-01-01",
  end_date: "2021-01-02",
  status: "pending",
  type: "development",
  user_id: 1,
};

describe("PUT /api/leaves/:id", () => {
  let leaveId;
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.login("admin");
    // create a leave to update
    api.post("/api/leaves", validLeave).then((response) => {
      leaveId = response.body.id;
    });
    cy.logout();
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .put(
          `/api/leaves/${leaveId}`,
          {
            ...validLeave,
            description: "Updated leave",
          },
          { failOnStatusCode: false },
        )
        .its("status")
        .should("eq", 401);
    });
  });

  const cannotEditLeaves = ["basic_user", "view_user"];

  cannotEditLeaves.forEach((role) => {
    context(`as a user with '${role}' role`, () => {
      beforeEach(() => {
        cy.login(role);
      });

      it(`does not permit a "${role}" to update a leave`, () => {
        api
          .put(
            `/api/leaves/${leaveId}`,
            {
              ...validLeave,
              description: "Updated Leave",
            },
            { failOnStatusCode: false },
          )
          .then((response) => {
            expect(response.status).to.eq(403);
          });
      });
    });
  });

  const canEditLeaves = ["global_group_admin", "site_admin", "admin"];
  canEditLeaves.forEach((role) => {
    context(`as a user with '${role}' role`, () => {
      beforeEach(() => {
        cy.login(role);
      });

      it(`lets a "${role}" update a leave`, () => {
        api
          .put(`/api/leaves/${leaveId}`, {
            ...validLeave,
            description: "Updated Leave",
          })
          .then((response) => {
            expect(response.status).to.eq(200);
            const leave = response.body;
            expect(leave.description).to.eq("Updated Leave");
          });
      });
    });
  });

  context("as the leave subject user", () => {
    it("does not permit a leave user without edit privs to update a leave", () => {
      cy.login("admin");

      // get the user id of the `basic_user`
      let basicUserId: number | null = null;
      let leaveId: number | null = null;
      cy.getUserByUsername("basic_user")
        .then((user) => {
          basicUserId = user.id;

          // then create a leave for that user
          return api.post("/api/leaves", {
            ...validLeave,
            user_id: basicUserId,
          });
        })
        .then((response) => {
          leaveId = response.body.id;

          // now login as the basic user and
          // try to update the leave
          cy.login("basic_user");
          return api
            .put(
              `/api/leaves/${leaveId}`,
              {
                ...validLeave,
                description: "Updated Leave",
              },
              { failOnStatusCode: false },
            )
            .then((response) => {
              expect(response.status).to.eq(403);
            });
        });
    });
  });

  context("as a leave editor", () => {
    beforeEach(() => {
      cy.login("global_group_admin");
    });

    it("fails if any required field is missing", () => {
      const requiredFields = [
        "description",
        "start_date",
        "end_date",
        "status",
        "type",
        "user_id",
      ];

      requiredFields.forEach((field) => {
        const leave = { ...validLeave, [field]: null };

        api
          .put(`/api/leaves/${leaveId}`, leave, { failOnStatusCode: false })
          .then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.errors[field][0]).to.eq(
              `The ${field.replace("_", " ")} field is required.`,
            );
          });
      });
    });

    it("fails if user_id is not a valid user", () => {
      const leave = { ...validLeave, user_id: 999 };

      api
        .put(`/api/leaves/${leaveId}`, leave, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(422);
          expect(response.body.errors.user_id[0]).to.eq(
            "The selected user id is invalid.",
          );
        });
    });

    it("fails if description is too long", () => {
      const leave = {
        ...validLeave,
        description: "a".repeat(256),
      };

      api
        .put(`/api/leaves/${leaveId}`, leave, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(422);
          expect(response.body.errors.description[0]).to.eq(
            "The description may not be greater than 255 characters.",
          );
        });
    });

    it("fails if start_date or end_date are not valid dates", () => {
      ["start_date", "end_date"].forEach((field) => {
        const leave = {
          ...validLeave,
          [field]: "not a date",
        };

        api
          .put(`/api/leaves/${leaveId}`, leave, { failOnStatusCode: false })
          .then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.errors[field][0]).to.eq(
              `The ${field.replace("_", " ")} is not a valid date.`,
            );
          });
      });
    });

    it("fails if end_date is before start_date", () => {
      const leave = {
        ...validLeave,
        start_date: "2021-01-02",
        end_date: "2021-01-01",
      };

      api
        .put(`/api/leaves/${leaveId}`, leave, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(422);
          expect(response.body.errors.end_date[0]).to.eq(
            "The end date must be a date after start date.",
          );
        });
    });

    it("fails if status or type is not valid", () => {
      ["status", "type"].forEach((field) => {
        const leave = {
          ...validLeave,
          [field]: "invalid",
        };

        api
          .put(`/api/leaves/${leaveId}`, leave, { failOnStatusCode: false })
          .then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.errors[field][0]).to.eq(
              `The selected ${field} is invalid.`,
            );
          });
      });
    });
  });
});
