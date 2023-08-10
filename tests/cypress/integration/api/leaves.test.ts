import * as api from "../../support/api";

function hasExpectedLeaveShape(leave) {
  return expect(leave).to.have.keys([
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
}

describe("Leaves API", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  context("as an unauthenticated user", () => {
    describe("GET /api/leaves", () => {
      it("returns a 401", () => {
        api
          .get("/api/leaves", { failOnStatusCode: false })
          .its("status")
          .should("eq", 401);
      });
    });
  });

  context("as a basic user", () => {
    beforeEach(() => {
      cy.login("basic_user");
    });
  });

  context("as admin user", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    describe("GET /api/leaves", () => {
      it("returns a list of leaves", () => {
        api.get("/api/leaves").then((response) => {
          expect(response.status).to.eq(200);

          const leaves = response.body.data;
          expect(leaves).to.have.length.greaterThan(0);
          hasExpectedLeaveShape(leaves[0]);
        });
      });
    });

    describe("GET /api/leaves/:id", () => {
      it("returns a single leave", () => {
        api.get("/api/leaves/1").then((response) => {
          expect(response.status).to.eq(200);

          const leave = response.body;
          hasExpectedLeaveShape(leave);
        });
      });

      it('404s with an invalid "id" parameter', () => {
        api
          .get("/api/leaves/999", { failOnStatusCode: false })
          .then((response) => {
            expect(response.status).to.eq(404);
          });
      });
    });

    describe("POST /api/leaves", () => {
      const validLeave = {
        description: "New leave",
        start_date: "2021-01-01",
        end_date: "2021-01-02",
        status: "pending",
        type: "development",
        user_id: 1,
      };

      it("creates a new leave", () => {
        api.post("/api/leaves", validLeave).then((response) => {
          expect(response.status).to.eq(201);
          hasExpectedLeaveShape(response.body);
        });
      });

      it("fails if any field is missing", () => {
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

    describe("PUT /api/leaves/:id", () => {
      const validLeave = {
        description: "New leave",
        start_date: "2021-01-01",
        end_date: "2021-01-02",
        status: "pending",
        type: "development",
        user_id: 1,
      };

      it("updates a leave", () => {
        api.put("/api/leaves/1", validLeave).then((response) => {
          expect(response.status).to.eq(200);
          hasExpectedLeaveShape(response.body);
        });
      });

      it("fails if any field is missing", () => {
        const fields = Object.keys(validLeave);

        fields.forEach((field) => {
          const leave = { ...validLeave, [field]: null };

          api
            .put("/api/leaves/1", leave, { failOnStatusCode: false })
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
          .put("/api/leaves/1", leave, { failOnStatusCode: false })
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
          .put("/api/leaves/1", leave, { failOnStatusCode: false })
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
            .put("/api/leaves/1", leave, { failOnStatusCode: false })
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
          .put("/api/leaves/1", leave, { failOnStatusCode: false })
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
            .put("/api/leaves/1", leave, { failOnStatusCode: false })
            .then((response) => {
              expect(response.status).to.eq(422);
              expect(response.body.errors[field][0]).to.eq(
                `The selected ${field} is invalid.`,
              );
            });
        });
      });
    });
  }); // as an admin user
});
