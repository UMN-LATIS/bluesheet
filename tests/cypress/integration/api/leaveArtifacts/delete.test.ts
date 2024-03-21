import api from "../../../support/api";

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

describe("DELETE /api/leaves/:leaveId/artifacts/:artifactId", () => {
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
        .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
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

    it('does not permit a "view_user" to delete an artifact', () => {
      api
        .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        })
        .then((response) => {
          expect(response.status).to.eq(403);
        });
    });
  });

  it("lets a user with `edit leaves` permission delete an artifact", () => {
    cy.login("edit_user");

    // give the user permission to edit leaves
    cy.givePermissionToUser("edit leaves", "edit_user");

    api
      .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
      .then((response) => {
        expect(response.status).to.eq(204);
      })
      .then(() => {
        return api.get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(404);
      });
  });

  context("as a group member with `admin` flag", () => {
    let userWithLeave = null;
    let testUser = null;
    let testRole = null;
    let testGroup = null;
    let testUserMembership = null;
    let leaveUserMembership = null;

    beforeEach(() => {
      cy.php(`App\\User::findOrFail(${validLeave.user_id})`)
        .then((user) => {
          userWithLeave = user;
        })
        .then(() => {
          // create another user
          return cy.create({
            model: "App\\User",
            attributes: {
              displayname: "Test User",
              umndid: "test_user",
            },
          });
        })
        .then((newUser) => {
          testUser = newUser;
          return cy.create({
            model: "App\\Group",
            attributes: {
              group_title: "Test Group",
              active_group: true,
              group_type_id: 1,
            },
          });
        })
        .then((group) => {
          testGroup = group;
          return cy.create({
            model: "App\\Role",
            attributes: {
              label: "Member",
            },
          });
        })
        .then((role) => {
          testRole = role;

          // add leave user to the group
          cy.create({
            model: "App\\Membership",
            attributes: {
              user_id: userWithLeave.id,
              group_id: testGroup.id,
              role_id: testRole.id,
            },
          }).then((membership) => (leaveUserMembership = membership));

          // add test user to the group with admin flag set
          cy.create({
            model: "App\\Membership",
            attributes: {
              user_id: testUser.id,
              group_id: testGroup.id,
              role_id: testRole.id,

              // this is the important part
              admin: true,
            },
          }).then((membership) => (testUserMembership = membership));
        });
    });

    it("delete an artifact of another group member", () => {
      cy.login(testUser.umndid);
      api
        .delete(`/api/leaves/${leaveId}/artifacts/${artifactId}`)
        .then((response) => {
          expect(response.status).to.eq(204);
        })
        .then(() => {
          return api.get(`/api/leaves/${leaveId}/artifacts/${artifactId}`, {
            failOnStatusCode: false,
          });
        })
        .then((response) => {
          expect(response.status).to.eq(404);
        });
    });
  });
});
