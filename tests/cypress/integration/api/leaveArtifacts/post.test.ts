import * as api from "../../../support/api";

const validLeave = {
  description: "New leave",
  start_date: "2021-01-01",
  end_date: "2021-01-02",
  status: "pending",
  type: "development",
  user_id: 1,
};

const validArtifact = {
  label: "New artifact",
  target: "https://example.com",
};

describe("POST /api/leaves/:leaveId/artifacts", () => {
  let leaveId;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.login("admin");

    api.post("/api/leaves", validLeave).then((response) => {
      leaveId = response.body.id;
      cy.logout();
    });
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .post(`/api/leaves/${leaveId}/artifacts`, validArtifact, {
          failOnStatusCode: false,
        })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a user that can view leaves", () => {
    beforeEach(() => {
      cy.login("view_user");
    });

    it('does not permit a "view_user" to create an artifact', () => {
      api
        .post(`/api/leaves/${leaveId}/artifacts`, validArtifact, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  context("as a user that can edit leaves", () => {
    beforeEach(() => {
      cy.login("group_admin");
    });

    it('lets a "group_admin" create an artifact', () => {
      api
        .post(`/api/leaves/${leaveId}/artifacts`, validArtifact)
        .then((response) => {
          expect(response.status).to.eq(201);
          const artifact = response.body;
          expect(artifact).to.have.keys([
            "id",
            "leave_id",
            "label",
            "target",
            "created_at",
            "updated_at",
          ]);
        });
    });

    it("fails if any required field is missing", () => {
      const fields = Object.keys(validArtifact);

      fields.forEach((field) => {
        const artifact = { ...validArtifact, [field]: null };

        api
          .post(`/api/leaves/${leaveId}/artifacts`, artifact, {
            failOnStatusCode: false,
          })
          .then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.errors[field][0]).to.eq(
              `The ${field.replace("_", " ")} field is required.`,
            );
          });
      });
    });
  });
});
