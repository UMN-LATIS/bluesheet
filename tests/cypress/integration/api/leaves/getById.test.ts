import { UserPermissions } from "../../../../../resources/js/types";
import * as api from "../../../support/api";

describe("GET /api/leaves/:id", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  it("returns a 401 for unauthenticated users", () => {
    api
      .get("/api/leaves/1", { failOnStatusCode: false })
      .its("status")
      .should("eq", 401);
  });

  it("does not permit a user to view another's leave", () => {
    cy.login("basic_user");
    api.get("/api/leaves/1", { failOnStatusCode: false }).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("lets a user view their own leave", () => {
    let leave;

    // create a new leave for the basic user
    cy.create("App\\Leave")
      .then((createdLeave) => {
        leave = createdLeave;
        cy.logout();
      })
      .then(() => {
        // login as the basic user and check we can view it
        cy.login({ id: leave.user_id });
        api.get(`/api/leaves/${leave.id}`).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.keys([
            "id",
            "user_id",
            "description",
            "start_date",
            "end_date",
            "type",
            "status",
            "user",
            "artifacts",
            "created_at",
            "updated_at",
          ]);
        });
      });
  });

  context("as admin user", () => {
    beforeEach(() => {
      cy.login("admin");
    });

    it("returns a single leave", () => {
      api.get("/api/leaves/1").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.keys([
          "id",
          "user_id",
          "description",
          "start_date",
          "end_date",
          "type",
          "status",
          "user",
          "artifacts",
          "created_at",
          "updated_at",
        ]);
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

  context('as a user with "view any leaves" permission', () => {
    beforeEach(() => {
      cy.addPermissionToUser(UserPermissions.VIEW_ANY_LEAVES, "basic_user");
    });

    it("lets a user get another user leave", () => {
      cy.login("basic_user");

      api.get("/api/leaves/1").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.keys([
          "id",
          "user_id",
          "description",
          "start_date",
          "end_date",
          "type",
          "status",
          "user",
          "artifacts",
          "created_at",
          "updated_at",
        ]);
      });
    });
  });
});
