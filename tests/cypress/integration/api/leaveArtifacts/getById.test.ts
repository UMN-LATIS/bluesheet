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

describe("GET /api/leaves/:leaveId/artifacts/:artifactId", () => {
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
        .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        })
        .its("status")
        .should("eq", 401);
    });
  });

  context("as a user that cannot view leaves", () => {
    beforeEach(() => {
      cy.login("basic_user");
    });

    it('does not permit a "basic_user" to view leaves', () => {
      api
        .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  context("as a user that can view leaves", () => {
    beforeEach(() => {
      cy.login("group_admin");
    });

    it('lets a "group_admin" view an artifact', () => {
      api
        .get(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
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
          expect(artifact.label).to.eq(validArtifact.label);
          expect(artifact.target).to.eq(validArtifact.target);
        });
    });
  });
});
