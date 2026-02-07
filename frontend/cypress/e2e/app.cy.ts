describe('App', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('loads the main menu', () => {
    cy.contains('anaroo').should('be.visible');
    cy.contains('Start Game').should('be.visible');
    cy.contains('View Leaderboard').should('be.visible');
  });

  it('shows the navbar with login icon when not authenticated', () => {
    // Icon-based nav doesn't show text, but should have title attribute
    cy.get('.nav-icon[title="Sign In"]').should('be.visible');
  });

  it('displays all three game modes', () => {
    cy.contains('Daily').should('be.visible');
    cy.contains('Timed').should('be.visible');
    cy.contains('Infinite Survival').should('be.visible');
  });
});

describe('Mode Selection', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('selects Daily mode', () => {
    cy.contains('button', 'Daily').click();
    cy.contains('One word per day').should('be.visible');
  });

  it('selects Timed mode and shows duration picker', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('30s').should('be.visible');
    cy.contains('60s').should('be.visible');
    cy.contains('120s').should('be.visible');
  });

  it('hides duration picker for non-timed modes', () => {
    cy.contains('button', 'Daily').click();
    cy.contains('30s').should('not.exist');
  });

  it('selects different timed durations', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('button', '30s').click();
    cy.contains('button', '30s').should('have.class', 'active');
  });

  it('selects Infinite Survival mode', () => {
    cy.contains('button', 'Infinite Survival').click();
    cy.contains('Endless words').should('be.visible');
  });
});

describe('Auth Modal', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('opens auth modal when clicking sign in icon', () => {
    cy.get('.nav-icon[title="Sign In"]').click();
    cy.get('.modal-overlay').should('be.visible');
    cy.get('input#nickname').should('be.visible');
  });

  it('opens auth modal when starting game without auth', () => {
    cy.contains('Start Game').click();
    cy.get('.modal-overlay').should('be.visible');
  });

  it('closes modal when clicking overlay', () => {
    cy.get('.nav-icon[title="Sign In"]').click();
    cy.get('.modal-overlay').click({ force: true });
    cy.get('.modal-overlay').should('not.exist');
  });

  it('closes modal when clicking X button', () => {
    cy.get('.nav-icon[title="Sign In"]').click();
    cy.get('.modal-close').click();
    cy.get('.modal-overlay').should('not.exist');
  });

  it('switches between login and register forms', () => {
    cy.get('.nav-icon[title="Sign In"]').click();
    cy.contains('Create an account').click();
    cy.get('h2').should('contain', 'Register');
    cy.contains('Already have an account').click();
    cy.get('h2').should('contain', 'Sign In');
  });
});

describe('Leaderboard', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('navigates to leaderboard view', () => {
    cy.contains('View Leaderboard').click();
    cy.contains('h2', 'Leaderboard').should('be.visible');
    cy.contains('← Back').should('be.visible');
  });

  it('shows mode tabs on leaderboard', () => {
    cy.contains('View Leaderboard').click();
    cy.get('.mode-tabs').within(() => {
      cy.contains('Daily');
      cy.contains('Timed');
      cy.contains('Survival');
    });
  });

  it('shows type tabs (Daily / All-Time)', () => {
    cy.contains('View Leaderboard').click();
    cy.get('.type-tabs').within(() => {
      cy.contains('Daily');
      cy.contains('All-Time');
    });
  });

  it('navigates back to menu from leaderboard', () => {
    cy.contains('View Leaderboard').click();
    cy.contains('← Back').click();
    cy.contains('Start Game').should('be.visible');
  });
});

describe('Navigation', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('navigates via navbar icons', () => {
    // Click leaderboard icon
    cy.get('.nav-icon[title="Leaderboard"]').click();
    cy.url().should('include', '/leaderboard');

    // Click about icon
    cy.get('.nav-icon[title="About"]').click();
    cy.url().should('include', '/about');

    // Click play icon to go home
    cy.get('.nav-icon[title="Play"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('shows user info in navbar when logged in', () => {
    cy.get('.nav-user').should('be.visible');
    cy.get('.nav-username').should('contain', 'TestPlayer');
  });

  it('navigates to profile when clicking user', () => {
    cy.get('.nav-user').click();
    cy.url().should('include', '/profile');
  });
});

describe('Footer Navigation', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('has footer links', () => {
    cy.get('.footer').within(() => {
      cy.contains('contact');
      cy.contains('about');
      cy.contains('github');
      cy.contains('terms');
      cy.contains('security');
      cy.contains('privacy');
    });
  });

  it('navigates to legal pages from footer', () => {
    cy.get('.footer').contains('terms').click();
    cy.url().should('include', '/terms');
    cy.contains('Terms of Service').should('be.visible');
  });
});
