describe('Authentication flows', () => {
  it('allows a new user to register and sign in', () => {
    const username = `cypress_user_${Date.now()}`;
    const password = 'StrongPass123!';

    cy.visit('/register');

    cy.get('input[name="fullName"]').type('Cypress Tester');
    cy.get('input[name="dob"]').type('01/01/1990');
    cy.get('input[name="email"]').type(`${username}@example.com`);
    cy.get('input[name="phone"]').type('0123456789');
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);

    const alerts = [];
    cy.on('window:alert', (text) => {
      alerts.push(text);
    });

    cy.get('form.register-form').submit();

    cy.wrap(null).should(() => {
      expect(alerts.some((text) => text.includes('Đăng ký thành công'))).to.be.true;
    });

    cy.visit('/login');
    cy.get('[data-testid="input-account"]').type(username);
    cy.get('[data-testid="input-password"]').type(password);

    const loginAlerts = [];
    cy.on('window:alert', (text) => {
      loginAlerts.push(text);
    });

    cy.get('[data-testid="login-button"]').click();

    cy.wrap(null).should(() => {
      expect(loginAlerts.some((text) => text.includes('Đăng nhập thành công'))).to.be.true;
    });

    cy.url().should('include', '/home');
  });

  it('authenticates an existing seeded user', () => {
    cy.login();
  });
});
