import * as api from "../../../support/api";

const validLeave = {
  description: "New leave",
  start_date: "2021-01-01",
  end_date: "2021-01-02",
  status: "pending",
  type: "development",
  user_id: 1,
};

describe("POST /api/leaves", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .post("/api/leaves", validLeave, { failOnStatusCode: false })
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

      it(`does not permit a "${role}" to create a leave`, () => {
        api
          .post("/api/leaves", validLeave, { failOnStatusCode: false })
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

      it(`lets a "${role}" create a leave`, () => {
        api.post("/api/leaves", validLeave).then((response) => {
          expect(response.status).to.eq(201);
          const leave = response.body;
          expect(leave).to.have.keys([
            "id",
            "user_id",
            "description",
            "start_date",
            "end_date",
            "type",
            "status",
            "user",
            "created_at",
            "updated_at",
          ]);
        });
      });
    });
  });

  context("as leave editor", () => {
    beforeEach(() => {
      cy.login("global_group_admin");
    });
    it("fails if any required field is missing", () => {
      const fields = Object.keys(validLeave);

      fields.forEach((field) => {
        const leave = { ...validLeave, [field]: null };

        api
          .post("/api/leaves", leave, { failOnStatusCode: false })
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
        .post("/api/leaves", leave, { failOnStatusCode: false })
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
        .post("/api/leaves", leave, { failOnStatusCode: false })
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
          .post("/api/leaves", leave, { failOnStatusCode: false })
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
        .post("/api/leaves", leave, { failOnStatusCode: false })
        .then((response) => {
          expect(response.status).to.eq(422);
          expect(response.body.errors.end_date[0]).to.eq(
            "The end date must be a date after start date.",
          );
        });
    });

    it("fails if status or type an invalid values", () => {
      ["status", "type"].forEach((field) => {
        const leave = {
          ...validLeave,
          [field]: "invalid value",
        };

        api
          .post("/api/leaves", leave, { failOnStatusCode: false })
          .then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.errors[field][0]).to.eq(
              `The selected ${field.replace("_", " ")} is invalid.`,
            );
          });
      });
    });
  });

  context("as a fellow group member", () => {
    let fellowGroupMembership;
    let leave;

    beforeEach(() => {
      // create a new leave
      // which will also create the leaveOwner user
      cy.create("App\\Leave")
        .then((createdLeave) => {
          leave = createdLeave;

          // create a new membership for the leave owner
          // which will also create the group for our test
          return cy.create({
            model: "App\\Membership",
            attributes: {
              user_id: leave.user_id,
            },
          });
        })
        .then((leaveUserMembership) => {
          // create another membership within the group
          // which will also create a fellow group member
          // which we can promote to a group manager when
          // we want
          return cy.create({
            model: "App\\Membership",
            attributes: {
              group_id: leaveUserMembership.group_id,
            },
          });
        })
        .then((membership) => {
          fellowGroupMembership = membership;

          cy.login({
            id: fellowGroupMembership.user_id,
          });
        });
    });

    it("lets a group manager create a new leave for any member", () => {
      // promote the follow group member to a group manager
      cy.promoteUserToGroupManager({
        userId: fellowGroupMembership.user_id,
        groupId: fellowGroupMembership.group_id,
      })
        .then(() => {
          // then login as the group manager and check we can view the leave
          cy.login({ id: fellowGroupMembership.user_id });
        })
        .then(() => {
          // create a new leave for the first leave's owner
          // who is a member of the same group
          return api.post("/api/leaves", {
            ...validLeave,
            user_id: leave.user_id,
          });
        })
        .then((response) => {
          expect(response.status).to.eq(201);
          const leave = response.body;
          expect(leave).to.have.keys([
            "id",
            "user_id",
            "description",
            "start_date",
            "end_date",
            "type",
            "status",
            "user",
            "created_at",
            "updated_at",
          ]);
        });
    });

    it("does not permit users to create leaves if they aren't group managers", () => {
      cy.login({ id: fellowGroupMembership.user_id });

      api
        .post(
          `/api/leaves`,
          {
            ...validLeave,
            user_id: leave.user_id,
          },
          { failOnStatusCode: false },
        )
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });
});
