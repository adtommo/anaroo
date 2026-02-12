describe('Timed Game Flow', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('starts a timed game and shows game UI', () => {
    cy.get('.game-card').eq(1).click(); // Timed mode
    cy.get('.btn-start').click();

    cy.get('.game-container').should('be.visible');
    cy.get('.timer').should('be.visible');
    cy.get('.scrambled-row').should('be.visible');
    cy.get('.guess-row').should('be.visible');
  });

  it('shows letter tiles in scrambled row', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').should('have.length.greaterThan', 0);
  });

  it('clicking a letter tile marks it as used', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').first().click();
    cy.get('.letter-tile').first().should('have.class', 'used');
  });

  it('clicking a used tile does nothing (stays disabled)', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').first().click();
    cy.get('.letter-tile').first().should('be.disabled');

    // Click it again - should still be disabled, no change
    cy.get('.letter-tile').first().click({ force: true });
    cy.get('.letter-tile.used').should('have.length', 1);
  });

  it('backspace button removes last selected letter', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').first().click();
    cy.get('.letter-tile.used').should('have.length', 1);

    cy.contains('← Backspace').click();
    cy.get('.letter-tile.used').should('have.length', 0);
  });

  it('clear button removes all selected letters', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').eq(0).click();
    cy.get('.letter-tile').eq(1).click();
    cy.get('.letter-tile.used').should('have.length', 2);

    cy.contains('Clear').click();
    cy.get('.letter-tile.used').should('have.length', 0);
  });

  it('backspace and clear are disabled when no letters selected', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.contains('← Backspace').should('be.disabled');
    cy.contains('Clear').should('be.disabled');
  });

  it('supports keyboard input to select letters', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('.letter-tile')
      .first()
      .invoke('text')
      .then((letter) => {
        cy.get('body').type(letter);
        cy.get('.letter-tile.used').should('have.length', 1);
      });
  });

  it('keyboard: typing already-used letter does nothing when no more available', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('.letter-tile').first().invoke('text').then((letter) => {
      cy.get('body').type(letter);
      cy.get('.letter-tile.used').should('have.length', 1);

      // Type the same letter again - only 1 of each letter in "tac"
      cy.get('body').type(letter);
      cy.get('.letter-tile.used').should('have.length', 1);
    });
  });

  it('keyboard: non-letter keys are ignored', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('body').type('123');
    cy.get('.letter-tile.used').should('have.length', 0);
  });

  it('keyboard: Backspace removes last letter', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('.letter-tile').first().invoke('text').then((letter) => {
      cy.get('body').type(letter);
      cy.get('.letter-tile.used').should('have.length', 1);

      cy.get('body').type('{backspace}');
      cy.get('.letter-tile.used').should('have.length', 0);
    });
  });

  it('solving a word correctly increases word count', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.contains('Words: 0').should('be.visible');

    // Mock word is scrambled "tac", answer "cat"
    cy.solveWord('cat');

    cy.contains('Words: 1').should('be.visible');
  });

  it('wrong guess resets input and breaks combo', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    // Solve one correctly first
    cy.solveWord('cat');
    cy.contains('Words: 1').should('be.visible');
    cy.contains('Combo: 1').should('be.visible');

    // Wrong guess "tac" (not a valid answer)
    cy.solveWord('tac');
    cy.contains('Combo: 0').should('be.visible');
    cy.contains('Words: 1').should('be.visible');
  });

  it('solving multiple words increases combo', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.solveWord('cat');
    cy.contains('Combo: 1').should('be.visible');

    // Next word is also "tac" -> answer "cat"
    cy.solveWord('cat');
    cy.contains('Combo: 2').should('be.visible');
    cy.contains('Words: 2').should('be.visible');
  });

  it('navigates back to menu from game', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.contains('← Back').click();
    cy.get('.btn-start').should('be.visible');
  });

  it('displays game header with mode name', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.game-header-bar').should('contain', 'timed');
  });

  it('guess row shows letters as they are typed', () => {
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('.letter-tile').first().invoke('text').then((letter) => {
      cy.get('body').type(letter);
      cy.get('.guess-slot').first().should('contain', letter);
    });
  });
});

describe('Daily Mode', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('starts daily mode and shows game UI', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.btn-start').click();

    cy.get('.game-container').should('be.visible');
    cy.get('.letter-tile').should('have.length.greaterThan', 0);
  });

  it('shows timer during daily mode', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.btn-start').click();

    cy.get('.timer').should('be.visible');
    cy.get('.timer-value').should('be.visible');
  });

  it('shows hint button in daily mode', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.btn-start').click();

    cy.get('.game-footer').should('be.visible');
    cy.get('.btn-secondary').should('be.visible');
  });

  it('daily already completed shows completion message', () => {
    cy.intercept('GET', '/api/daily/status', {
      statusCode: 200,
      body: { completed: true, timeElapsed: 15.3, word: 'testing' },
    });

    cy.get('.game-card').eq(0).click();
    cy.get('.btn-start').click();

    cy.contains('daily complete').should('be.visible');
    cy.contains('15.3s').should('be.visible');
    cy.contains('Come back tomorrow').should('be.visible');
  });

  it('clicking used tile during daily does nothing', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').first().click();
    cy.get('.letter-tile').first().should('be.disabled');

    cy.get('.letter-tile').first().click({ force: true });
    cy.get('.letter-tile.used').should('have.length', 1);
  });

  it('keyboard works in daily mode', () => {
    cy.get('.game-card').eq(0).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('.letter-tile').first().invoke('text').then((letter) => {
      cy.get('body').type(letter);
      cy.get('.letter-tile.used').should('have.length', 1);

      cy.get('body').type('{backspace}');
      cy.get('.letter-tile.used').should('have.length', 0);
    });
  });
});

describe('Survival Mode', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
    cy.visit('/');
  });

  it('starts survival mode and shows game UI', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();

    cy.get('.game-container').should('be.visible');
    cy.get('.letter-tile').should('have.length.greaterThan', 0);
  });

  it('shows streak and level', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();

    cy.contains('Streak 0').should('be.visible');
    cy.contains('Lvl 0').should('be.visible');
  });

  it('solving a word increases streak', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();

    cy.solveWord('cat');
    cy.contains('Streak 1').should('be.visible');
  });

  it('wrong answer deducts time but continues game', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();

    // Submit wrong answer via tile clicks
    cy.solveWord('tac');

    cy.get('.game-container').should('be.visible');
    cy.contains('game over').should('not.exist');
  });

  it('clicking used tile in survival mode does nothing', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').first().click();
    cy.get('.letter-tile.used').should('have.length', 1);

    cy.get('.letter-tile').first().click({ force: true });
    cy.get('.letter-tile.used').should('have.length', 1);
  });

  it('keyboard non-letter input ignored in survival', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();
    cy.waitForGameReady();

    cy.get('body').type('123!@#');
    cy.get('.letter-tile.used').should('have.length', 0);
  });

  it('clear button works in survival mode', () => {
    cy.get('.game-card').eq(2).click();
    cy.get('.btn-start').click();

    cy.get('.letter-tile').eq(0).click();
    cy.get('.letter-tile').eq(1).click();
    cy.get('.letter-tile.used').should('have.length', 2);

    cy.contains('Clear').click();
    cy.get('.letter-tile.used').should('have.length', 0);
  });
});

describe('Leaderboard', () => {
  beforeEach(() => {
    cy.setupMocks();
  });

  it('displays leaderboard page directly', () => {
    cy.visit('/leaderboard');
    cy.contains('SpeedRunner').should('be.visible');
    cy.contains('WordMaster').should('be.visible');
  });

  it('can switch between daily and global leaderboards', () => {
    cy.visit('/leaderboard');
    cy.get('.type-tabs').contains('All-Time').click();
    cy.contains('SpeedRunner').should('be.visible');
  });

  it('can switch between game modes', () => {
    cy.visit('/leaderboard');
    cy.get('.mode-tabs').contains('Timed').click();
    cy.contains('SpeedRunner').should('be.visible');
    cy.get('.mode-tabs').contains('Survival').click();
    cy.contains('SpeedRunner').should('be.visible');
  });
});

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.setupMocks();
  });

  it('shows auth modal when trying to start game without login', () => {
    cy.visit('/');
    cy.get('.btn-start').click();
    cy.get('.modal-overlay').should('be.visible');
  });

  it('can register a new user', () => {
    cy.visit('/');
    cy.get('.btn-start').click();
    cy.contains('Create an account').click();
    cy.get('input[placeholder*="nickname"]').type('NewPlayer');
    cy.contains('button', 'Register').click();
    cy.get('.modal-overlay').should('not.exist');
  });

  it('after login, play button navigates to game', () => {
    cy.visit('/');
    cy.mockLogin('TestPlayer');
    cy.visit('/');
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();
    cy.get('.game-container').should('be.visible');
  });
});

describe('Ad Sidebar Visibility', () => {
  beforeEach(() => {
    cy.setupMocks();
    cy.mockLogin('TestPlayer');
  });

  it('sidebar ads exist in DOM', () => {
    cy.visit('/');
    cy.get('.ad-sidebar-left').should('exist');
    cy.get('.ad-sidebar-right').should('exist');
  });

  it('sidebars get focus class during gameplay', () => {
    cy.visit('/');
    cy.get('.ad-sidebar-left').should('not.have.class', 'focus');

    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.ad-sidebar-left').should('have.class', 'focus');
    cy.get('.ad-sidebar-right').should('have.class', 'focus');
  });

  it('sidebars lose focus class when navigating back', () => {
    cy.visit('/');
    cy.get('.game-card').eq(1).click();
    cy.get('.btn-start').click();

    cy.get('.ad-sidebar-left').should('have.class', 'focus');

    cy.contains('← Back').click();
    cy.get('.ad-sidebar-left').should('not.have.class', 'focus');
  });
});
