const hashedPassword = '$2b$10$3sl14EjzOk24B0LUQkFhheUUHaKA9d3rZp15eoZZjNh4nbjx6JG/u';

const createJsonResponse = (win, body, status = 200) =>
  new win.Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const createErrorResponse = (win, status, body) =>
  new win.Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Authentication flows', () => {
  it('successfully logs a user in', () => {
    cy.visit('/login', {
      onBeforeLoad(win) {
        const originalFetch = win.fetch.bind(win);
        win.__fetchCalls__ = [];

        cy.stub(win, 'fetch').callsFake((input, init = {}) => {
          const url = typeof input === 'string' ? input : input.url;
          const method = (init.method || 'GET').toUpperCase();
          win.__fetchCalls__.push({ url, method });

          if (url.includes('/rest/v1/users') && method === 'GET') {
            return Promise.resolve(
              createJsonResponse(win, {
                user_id: 1,
                password_hash: hashedPassword,
              })
            );
          }

          return originalFetch(input, init);
        });
      },
    });

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alert');
      cy.stub(win.location, 'reload').as('reload');
    });

    cy.get('[data-testid="input-account"]').type('testuser');
    cy.get('[data-testid="input-password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();

    cy.window().its('__fetchCalls__').should('have.length.at.least', 1);
    cy.get('@alert').should(
      'have.been.calledWith',
      'Đăng nhập thành công! Xin chào, testuser'
    );
    cy.get('@reload').should('have.been.called');
    cy.window().then((win) => {
      const storedId = win.localStorage.getItem('user_id');
      expect(storedId, 'encrypted user id saved').to.be.a('string').and.not.be.empty;
    });
  });

  it('registers a new user successfully', () => {
    cy.visit('/register', {
      onBeforeLoad(win) {
        const originalFetch = win.fetch.bind(win);
        let lookupCount = 0;
        win.__fetchCalls__ = [];

        cy.stub(win, 'fetch').callsFake((input, init = {}) => {
          const url = typeof input === 'string' ? input : input.url;
          const method = (init.method || 'GET').toUpperCase();
          win.__fetchCalls__.push({ url, method });

          if (url.includes('/rest/v1/users') && method === 'GET') {
            lookupCount += 1;
            if (lookupCount === 1) {
              return Promise.resolve(
                createErrorResponse(win, 404, {
                  message: 'No rows found',
                })
              );
            }

            return Promise.resolve(
              createJsonResponse(win, {
                user_id: 2,
              })
            );
          }

          if (url.includes('/rest/v1/users') && method === 'POST') {
            return Promise.resolve(
              createJsonResponse(win, [
                {
                  user_id: 2,
                },
              ], 201)
            );
          }

          if (url.includes('/rest/v1/wallets') && method === 'POST') {
            return Promise.resolve(
              createJsonResponse(win, [{ id: 1 }], 201)
            );
          }

          return originalFetch(input, init);
        });
      },
    });

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alert');
    });

    cy.get('input[name="fullName"]').type('Test User');
    cy.get('input[name="dob"]').type('01/01/1990');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="phone"]').type('1234567890');
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.contains('button', 'Đăng Ký').click();

    cy.window().its('__fetchCalls__').should('have.length.at.least', 3);
    cy.get('@alert').should('have.been.calledWith', '✅ Đăng ký thành công!');
  });
});
