describe("home", () => {
  it("should access successfully", () => {
    cy.request("/");
  });
});
