export const TRIO_UI_CONFIG = {
  selectors: {
    board: '#game-board',
    targetNumber: '#target-number',
    solutionsFound: '#solutions-found',
    difficultySelector: '#difficulty-selector',
    newGameBtn: '#new-game-btn',
  },
  classes: {
    cell: 'trio-cell',
    selected: 'selected',
    solution: 'solution',
  },
};

export function createTrioConfig(mode) {
  return TRIO_UI_CONFIG;
}
