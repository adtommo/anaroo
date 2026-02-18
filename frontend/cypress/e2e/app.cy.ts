describe('App', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('loads the main menu with logo and play button', () => {
    cy.contains('anaroo').should('be.visible');
    cy.get('.btn-start').should('be.visible').and('contain', 'play');
  });

  it('shows the navbar with login icon when not authenticated', () => {
    cy.get('.nav-icon[title="Sign In"]').should('be.visible');
  });

  it('displays all three game mode cards', () => {
    cy.get('.game-card').should('have.length', 3);
    cy.get('.game-card-title').eq(0).should('contain', 'daily');
    cy.get('.game-card-title').eq(1).should('contain', 'timed');
    cy.get('.game-card-title').eq(2).should('contain', 'survival');
  });

  it('shows mode descriptions', () => {
    cy.contains('one word per day').should('be.visible');
  });

  it('shows game demo animation', () => {
    cy.get('.game-demo').should('be.visible');
    cy.get('.demo-guess-row').should('be.visible');
    cy.get('.demo-scrambled-row').should('be.visible');
  });
});

describe('Mode Selection', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('selects daily mode card', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.game-card').eq(0).should('have.class', 'selected');
    cy.contains('one word per day').should('be.visible');
  });

  it('selects timed mode and shows duration picker', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.game-card').eq(1).should('have.class', 'selected');
    cy.contains('30s').should('be.visible');
    cy.contains('60s').should('be.visible');
    cy.contains('120s').should('be.visible');
  });

  it('hides duration picker for non-timed modes', () => {
    cy.get('.game-card').eq(0).click();
    cy.contains('button', '30s').should('not.exist');
  });

  it('selects different timed durations', () => {
    cy.get('.game-card').eq(1).click();
    cy.contains('button', '30s').click();
    cy.contains('button', '30s').should('have.class', 'active');
  });

  it('selects survival mode', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.game-card').eq(2).should('have.class', 'selected');
    cy.contains('endless words').should('be.visible');
  });

  it('shows difficulty options for timed mode', () => {
    cy.get('.game-card').eq(1).click();
    cy.contains('button', 'easy').should('be.visible');
    cy.contains('button', 'medium').should('be.visible');
    cy.contains('button', 'hard').should('be.visible');
  });

  it('hides difficulty for daily mode', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.settings-label').should('not.exist');
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

  it('starts game without auth and navigates to play', () => {
    cy.get('.btn-start').click();
    cy.url().should('include', '/play');
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

  it('requires nickname to be entered', () => {
    cy.get('.nav-icon[title="Sign In"]').click();
    cy.get('input#nickname').should('be.visible');
    // Nickname field should be required
    cy.get('input#nickname').should('have.attr', 'required');
  });
});

describe('Leaderboard', () => {
  beforeEach(() => {
    cy.setupMocks();
  });

  it('navigates to leaderboard via navbar icon', () => {
    cy.visit('/');
    cy.get('.nav-icon[title="Leaderboard"]').click();
    cy.url().should('include', '/leaderboard');
    cy.contains('h2', 'Leaderboard').should('be.visible');
    cy.contains('← Back').should('be.visible');
  });

  it('shows mode tabs on leaderboard', () => {
    cy.visit('/leaderboard');
    cy.get('.mode-tabs').within(() => {
      cy.contains('Daily');
      cy.contains('Timed');
      cy.contains('Survival');
    });
  });

  it('shows type tabs (Daily / All-Time)', () => {
    cy.visit('/leaderboard');
    cy.get('.type-tabs').within(() => {
      cy.contains('Daily');
      cy.contains('All-Time');
    });
  });

  it('navigates back to menu from leaderboard', () => {
    cy.visit('/leaderboard');
    cy.contains('← Back').click();
    cy.get('.btn-start').should('be.visible');
  });

  it('displays leaderboard entries', () => {
    cy.visit('/leaderboard');
    cy.contains('SpeedRunner').should('be.visible');
    cy.contains('WordMaster').should('be.visible');
  });

  it('switches between daily and global views', () => {
    cy.visit('/leaderboard');
    cy.get('.type-tabs').contains('All-Time').click();
    cy.contains('SpeedRunner').should('be.visible');
    cy.get('.type-tabs').contains('Daily').click();
    cy.contains('SpeedRunner').should('be.visible');
  });

  it('switches between game mode tabs', () => {
    cy.visit('/leaderboard');
    cy.get('.mode-tabs').contains('Timed').click();
    cy.contains('SpeedRunner').should('be.visible');
    cy.get('.mode-tabs').contains('Survival').click();
    cy.contains('SpeedRunner').should('be.visible');
  });
});

describe('Navigation', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('navigates via navbar icons', () => {
    cy.get('.nav-icon[title="Leaderboard"]').click();
    cy.url().should('include', '/leaderboard');

    cy.get('.nav-icon[title="About"]').click();
    cy.url().should('include', '/about');

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

  it('highlights active nav icon', () => {
    cy.get('.nav-icon[title="Play"]').should('have.class', 'active');
    cy.get('.nav-icon[title="Leaderboard"]').click();
    cy.get('.nav-icon[title="Leaderboard"]').should('have.class', 'active');
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

describe('Skip Link Accessibility', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('has a skip-to-content link', () => {
    cy.get('.skip-link').should('exist');
    cy.get('.skip-link').should('have.attr', 'href', '#main-content');
  });

  it('main content has the correct id', () => {
    cy.get('#main-content').should('exist');
  });
});
