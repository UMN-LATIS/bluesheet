import dayjs from "dayjs";

describe("User leaves", () => {
  let basicUserId: number | null = null;
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed("TestDatabaseSeeder");
    cy.getUserByUsername("basic_user").then((user) => {
      basicUserId = user.id;
    });

    cy.intercept({
      method: "POST",
      url: "/api/leaves",
    }).as("apiCreateLeave");
  });

  context("as a user that can view leaves", () => {
    beforeEach(() => {
      cy.login("global_group_admin");
    });

    it("displays the user's leaves", () => {
      cy.visit(`/user/${basicUserId}`);
      // expect the leaves table to have two leaves + show more row
      cy.get("[data-cy=leaveRow]").should("have.length", 2);

      // click Show Past
      cy.get("[data-cy=leavesSection]").contains("Show Past").click();

      // expect a total of 5 rows now
      cy.get("[data-cy=leaveRow]").should("have.length", 5);
    });
  });

  context("as a user that can create new leaves", () => {
    beforeEach(() => {
      cy.login("global_group_admin");
    });

    it("creates a new leave", () => {
      const startDate = dayjs().add(30, "day");
      const endDate = dayjs().add(60, "day");

      cy.visit(`/user/${basicUserId}`);

      // verify that only 2 leaves exist
      cy.get("[data-cy=leaveRow]").should("have.length", 2);

      cy.wait(300);

      // add a leave
      cy.contains("Add Leave").click();
      cy.get('[data-cy="leavesSection"] .is-new-leave')
        .first()
        .within(() => {
          cy.get("[data-cy=leaveDescription] input").type(
            "{selectall}Test Leave",
          );
          cy.get("[data-cy=leaveStartDate] input").type(
            startDate.format("YYYY-MM-DD"),
          );
          cy.get("[data-cy=leaveEndDate] input").type(
            endDate.format("YYYY-MM-DD"),
          );
          cy.get("[data-cy=leaveType] select").select("Development");
          cy.get("[data-cy=leaveStatus] select").select("Confirmed");
          cy.contains("Save").click();
        });

      // check that the leave was added
      cy.get("[data-cy=leaveRow]").should("have.length", 3);
      cy.contains("Test Leave")
        .closest("tr")
        .within(() => {
          cy.get("[data-cy=leaveStartDate]").contains(
            startDate.format("MMM D, YYYY"),
          );
          cy.get("[data-cy=leaveEndDate]").contains(
            endDate.format("MMM D, YYYY"),
          );
          cy.get("[data-cy=leaveType]").contains("Development");
          cy.get("[data-cy=leaveStatus]").contains("confirmed");
        });
    });

    it("edits a leave", () => {
      cy.visit(`/user/${basicUserId}`);
      cy.get("[data-cy=leaveRow]")
        .first()
        .within(() => {
          cy.contains("Edit").click();
          cy.get("[data-cy=leaveDescription] input")
            .first()
            .type("{selectall}Test Leave Edited");
          cy.contains("Save").click();
        });

      expect(cy.contains("Test Leave Edited")).to.exist;
    });

    it("deletes a leave", () => {
      cy.visit(`/user/${basicUserId}`);

      cy.get("[data-cy=leaveRow]").should("have.length", 2);

      cy.get("[data-cy=leaveRow]")
        .first()
        .within(() => {
          cy.contains("Delete").click();
        });

      cy.get("[data-cy=leaveRow]").should("have.length", 1);
    });

    it("cancels an edit", () => {
      cy.visit(`/user/${basicUserId}`);

      cy.get("[data-cy=leaveRow]")
        .first()
        .within(() => {
          cy.contains("Edit").click();
          cy.get("[data-cy=leaveDescription] input")
            .first()
            .type("{selectall}Test Leave Edited");
          // cy.contains("Cancel").click();
        });

      // cy.contains("Test Leave Edited").should("not.exist");
    });
  });

  context("as a user that can't create new leaves", () => {
    it('should not see the "Add Leave" button', () => {
      cy.login("basic_user");
      cy.visit("/user");
      cy.contains("Add Leave").should("not.exist");
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

    it("does not show leaves if the user is not a group manager", () => {
      cy.visit(`/user/${leave.user_id}`);
      cy.get("[data-cy=leavesSection]").should("not.exist");
    });

    context(
      "that is a group manager (has the `admin` flag set for the group)",
      () => {
        beforeEach(() => {
          // promote the follow group member to a group manager
          cy.promoteUserToGroupManager({
            userId: fellowGroupMembership.user_id,
            groupId: fellowGroupMembership.group_id,
          });
        });

        it.only("permits a group manager to see a fellow group member's leaves", () => {
          cy.visit(`/user/${leave.user_id}`);
          cy.get("[data-cy=leavesSection]").should("exist");
        });

        it(
          "allows a group manager to create a leave for a fellow group member",
        );
        it("allows a group manager to edit a leave for a fellow group member");
        it(
          "allows a group manager to delete a leave for a fellow group member",
        );
      },
    );
  });
});
