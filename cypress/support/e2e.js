import './commands';

Cypress.on('uncaught:exception', (err) => {
  // Prevent uncaught exceptions from failing tests when using mocked services
  console.error('Uncaught exception in test:', err);
  return false;
});
