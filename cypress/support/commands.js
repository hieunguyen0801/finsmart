Cypress.Commands.add('login', (username = 'demo', password = 'DemoPass123!') => {
  cy.visit('/login');
  cy.get('[data-testid="input-account"]').clear().type(username);
  cy.get('[data-testid="input-password"]').clear().type(password);

  cy.window().then((win) => {
    cy.stub(win, 'alert').as('loginAlert');
    if (win.location && typeof win.location.reload === 'function') {
      try {
        cy.stub(win.location, 'reload').as('reloadStub');
      } catch (error) {
        // Ignore if reload cannot be stubbed (read-only in some browsers)
      }
    }
  });

  cy.get('[data-testid="login-button"]').click();
  cy.get('@loginAlert').should('have.been.called');
  cy.url().should('include', '/home');
});
