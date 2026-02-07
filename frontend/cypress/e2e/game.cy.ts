describe('Game Flow', () => {
  beforeEach(() => {
    // Set up all API mocks before each test
    cy.setupMocks();
    // Log in with mock user
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('starts a timed game and shows game UI', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    // Game UI should appear
    cy.get('.game-container').should('be.visible');
    cy.get('.timer').should('be.visible');
    cy.get('.scrambled-row').should('be.visible');
    cy.get('.guess-row').should('be.visible');
  });

  it('shows letter tiles in scrambled row', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    cy.get('.letter-tile').should('have.length.greaterThan', 0);
  });

  it('can click letter tiles to build a guess', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    // Click the first letter tile
    cy.get('.letter-tile').first().click();
    cy.get('.letter-tile').first().should('have.class', 'used');
  });

  it('can use backspace to remove letters', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    cy.get('.letter-tile').first().click();
    cy.contains('← Backspace').click();

    // First tile should no longer be used
    cy.get('.letter-tile.used').should('have.length', 0);
  });

  it('supports keyboard input', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    // Get the first letter and type it
    cy.get('.letter-tile')
      .first()
      .invoke('text')
      .then((letter) => {
        cy.get('body').type(letter);
        cy.get('.letter-tile.used').should('have.length', 1);
      });
  });

  it('navigates back to menu from game', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    cy.contains('← Back').click();
    cy.contains('Start Game').should('be.visible');
  });

  it('displays game header with mode name', () => {
    cy.contains('button', 'Timed').click();
    cy.contains('Start Game').click();

    cy.get('.game-header-bar').should('contain', 'Timed');
  });
});

describe('Daily', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('can start daily mode', () => {
    cy.contains('button', 'Daily').click();
    cy.contains('Start Game').click();

    // Should show the daily challenge
    cy.get('.game-container').should('be.visible');
  });
});

describe('Leaderboard', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.visit('/');
  });

  it('displays leaderboard page', () => {
    cy.visit('/leaderboard');

    // Should show leaderboard entries
    cy.contains('SpeedRunner').should('be.visible');
    cy.contains('WordMaster').should('be.visible');
  });

  it('can switch between daily and global leaderboards', () => {
    cy.visit('/leaderboard');

    cy.contains('button', 'All-Time').click();
    cy.contains('SpeedRunner').should('be.visible');

    cy.contains('button', 'Daily').click();
    cy.contains('SpeedRunner').should('be.visible');
  });

  it('can switch between game modes', () => {
    cy.visit('/leaderboard');

    cy.contains('button', 'Timed').click();
    cy.contains('SpeedRunner').should('be.visible');

    cy.contains('button', 'Survival').click();
    cy.contains('SpeedRunner').should('be.visible');
  });
});

describe('Authentication', () => {
  beforeEach(() => {
    cy.setupMocks();
  });

  it('shows login modal when trying to start game without auth', () => {
    cy.visit('/');
    // Don't log in

    cy.contains('Start Game').click();

    // Should show auth modal
    cy.get('.modal').should('be.visible');
    cy.contains('Sign In').should('be.visible');
  });

  it('can register a new user', () => {
    cy.visit('/');

    cy.contains('Start Game').click();
    cy.contains('Create an account').click();

    cy.get('input[placeholder*="nickname"]').type('NewPlayer');
    cy.contains('button', 'Register').click();

    // Modal should close and game should be accessible
    cy.get('.modal').should('not.exist');
  });
});
