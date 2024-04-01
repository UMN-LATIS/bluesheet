describe("GET /api/remote/leaves", () => {
  beforeEach(() => {
    cy.refreshDatabase();
    cy.seed();
  });

  it("returns a 401 with invalid token", () => {
    cy.request({
      method: "GET",
      url: "/api/remote/leaves",
      headers: {
        Authorization: `Bearer 12345`,
        Accept: "application/json",
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
    });
  });

  it("returns a 403 for a non-wildcard token", () => {
    cy.php(
      `App\\User::where('umndid', 'basic_user')->firstOrFail()->createToken('test',['test_ability'])`,
    )
      .then((token) => {
        return cy.request({
          method: "GET",
          url: "/api/remote/leaves",
          headers: {
            Authorization: `Bearer ${token.plainTextToken}`,
            Accept: "application/json",
          },
          failOnStatusCode: false,
        });
      })
      .then((response) => {
        expect(response.status).to.eq(403);
      });
  });
});

it("returns a list of leaves for a super admin", () => {
  cy.php(
    `App\\User::where('umndid', 'admin')->firstOrFail()->createToken('test')`,
  )
    .then((token) => {
      return cy.request({
        method: "GET",
        url: "/api/remote/leaves",
        headers: {
          Authorization: `Bearer ${token.plainTextToken}`,
          Accept: "application/json",
        },
      });
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.length).to.be.greaterThan(0);
      expect(response.body[0]).to.have.keys([
        "id",
        "description",
        "start_date",
        "end_date",
        "type",
        "status",
        "user",
        "terms",
      ]);
    });
});
