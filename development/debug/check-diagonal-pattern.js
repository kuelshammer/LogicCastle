// Check if my diagonal pattern is actually correct

console.log('Checking diagonal pattern for (5,0), (4,1), (3,2), (2,3)');

// This should be an ascending diagonal (bottom-left to top-right)
const positions = [
  {row: 5, col: 0},
  {row: 4, col: 1},
  {row: 3, col: 2},
  {row: 2, col: 3}
];

console.log('Positions:');
positions.forEach((pos, i) => {
  console.log(`  ${i+1}. Row ${pos.row}, Col ${pos.col}`);
});

// Check if this forms a diagonal
// For ascending diagonal: each step should be row-1, col+1
let isDiagonal = true;
for (let i = 1; i < positions.length; i++) {
  const prev = positions[i-1];
  const curr = positions[i];

  const rowDiff = curr.row - prev.row;
  const colDiff = curr.col - prev.col;

  console.log(`  Step ${i}: Row diff ${rowDiff}, Col diff ${colDiff}`);

  if (rowDiff !== -1 || colDiff !== 1) {
    isDiagonal = false;
    console.log(`  ❌ Not diagonal! Expected (-1, +1), got (${rowDiff}, ${colDiff})`);
  }
}

if (isDiagonal) {
  console.log('✅ Pattern is a valid ascending diagonal!');
} else {
  console.log('❌ Pattern is NOT a valid diagonal!');
}

// Let's also check if my move sequence actually creates this pattern
console.log('\\nMove sequence analysis:');
console.log('Col 0: P1 move -> (5,0) ✓');
console.log('Col 1: P2 move -> (5,1)');
console.log('Col 1: P1 move -> (4,1) ✓');
console.log('Col 2: P2 move -> (5,2)');
console.log('Col 2: P1 move -> (4,2)');
console.log('Col 3: P2 move -> (5,3)');
console.log('Col 2: P1 move -> (3,2) ✓');
console.log('Col 3: P2 move -> (4,3)');
console.log('Col 3: P1 move -> (3,3)');
console.log('Col 4: P2 move -> (5,4)');
console.log('Col 3: P1 move -> (2,3) ✓ - Should complete diagonal');

console.log('\\nP1 positions after sequence:');
console.log('(5,0), (4,1), (4,2), (3,2), (3,3), (2,3)');
console.log('\\nDiagonal subset: (5,0), (4,1), (3,2), (2,3) ✅');
