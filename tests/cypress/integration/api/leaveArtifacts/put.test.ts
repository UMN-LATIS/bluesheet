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

describe("PUT /api/leaves/:leaveId/artifacts/:artifactId", () => {
  let leaveId;
  let artifactId;

  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();

    cy.login("admin");

    api
      .post("/api/leaves", validLeave)
      .then((response) => {
        leaveId = response.body.id;
        return leaveId;
      })
      .then((leaveId) => {
        return api
          .post(`/api/leaves/${leaveId}/artifacts`, validArtifact)
          .then((response) => {
            artifactId = response.body.id;
            return artifactId;
          });
      })
      .then(() => {
        cy.logout();
      });
  });

  context("as an unauthenticated user", () => {
    it("returns a 401", () => {
      api
        .put(`/api/leaves/${leaveId}/artifacts/${artifactId}`, validArtifact, {
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

    it('does not permit a "view_user" to update an artifact', () => {
      api
        .put(`/api/leaves/${leaveId}/artifacts/${artifactId}`, validArtifact, {
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

    it('lets a "group_admin" update an artifact', () => {
      api
        .put(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          label: "Updated artifact",
          target: "https://example.com/updated",
        })
        .then((response) => {
          expect(response.status).to.eq(200);
          const artifact = response.body;
          expect(artifact).to.have.keys([
            "id",
            "leave_id",
            "label",
            "target",
            "created_at",
            "updated_at",
          ]);
          expect(artifact.label).to.eq("Updated artifact");
          expect(artifact.target).to.eq("https://example.com/updated");
        });
    });

    it("fails if any required field is missing", () => {
      const fields = Object.keys(validArtifact);

      fields.forEach((field) => {
        const invalidArtifact = { ...validArtifact, [field]: null };

        api
          .put(
            `/api/leaves/${leaveId}/artifacts/${artifactId}`,
            invalidArtifact,
            {
              failOnStatusCode: false,
            },
          )
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
