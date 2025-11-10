describe('Core finance workflows', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a new income transaction successfully', () => {
    cy.visit('/transaction');

    cy.get('input[placeholder="Nhập số tiền"]').type('250000');
    cy.contains('button', 'Tiền lương').click();
    cy.get('input[placeholder="Nhập ghi chú..."]').type('Cypress test income');

    const now = new Date();
    const formatted = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    cy.get('input[type="datetime-local"]').type(formatted);

    const alerts = [];
    cy.on('window:alert', (text) => alerts.push(text));

    cy.contains('button', 'Xác nhận').click();

    cy.wrap(null).should(() => {
      expect(alerts.some((text) => text.includes('Thêm giao dịch thành công'))).to.be.true;
    });

    cy.get('input[placeholder="Nhập số tiền"]').should('have.value', '');
  });

  it('shows spending and income reports', () => {
    cy.visit('/statistic');

    cy.contains('.chart-title', 'Chi tiêu theo danh mục').should('be.visible');
    cy.contains('.chart-title', 'Thu chi theo tháng').should('be.visible');
    cy.contains('.chart-title', 'Số dư ví theo thời gian').should('be.visible');
    cy.get('canvas').should('have.length.greaterThan', 0);
  });
});
