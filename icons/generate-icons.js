#!/usr/bin/env node

/**
 * PWA Icon Generator for LogicCastle
 * Generates all required icon sizes for PWA
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🏰 Generating LogicCastle PWA Icons...');

// Create icons directory if it doesn't exist
if (!fs.existsSync('./icons')) {
  fs.mkdirSync('./icons');
}

sizes.forEach(size => {
  console.log(`📱 Creating ${size}x${size} icon...`);

  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create gradient background (LogicCastle brand colors)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');

  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add border radius effect (simulate rounded corners)
  const radius = size * 0.15;
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Add castle symbol
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Castle emoji alternative: simple geometric castle
  const centerX = size / 2;
  const centerY = size / 2;
  const castleSize = size * 0.6;

  // Draw simple castle silhouette
  ctx.fillStyle = 'white';

  // Main castle body
  const bodyWidth = castleSize * 0.7;
  const bodyHeight = castleSize * 0.5;
  const bodyX = centerX - bodyWidth / 2;
  const bodyY = centerY - bodyHeight / 4;

  ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

  // Castle towers
  const towerWidth = castleSize * 0.15;
  const towerHeight = castleSize * 0.3;

  // Left tower
  ctx.fillRect(bodyX - towerWidth * 0.7, bodyY - towerHeight * 0.3, towerWidth, towerHeight + bodyHeight);

  // Right tower
  ctx.fillRect(bodyX + bodyWidth - towerWidth * 0.3, bodyY - towerHeight * 0.3, towerWidth, towerHeight + bodyHeight);

  // Central tower
  ctx.fillRect(centerX - towerWidth / 2, bodyY - towerHeight * 0.5, towerWidth, towerHeight + bodyHeight);

  // Add crenellations (castle top details)
  const crenWidth = towerWidth * 0.3;
  const crenHeight = towerHeight * 0.2;

  // Left tower crenellations
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(bodyX - towerWidth * 0.7 + i * crenWidth * 1.2, bodyY - towerHeight * 0.3 - crenHeight, crenWidth, crenHeight);
  }

  // Right tower crenellations
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(bodyX + bodyWidth - towerWidth * 0.3 + i * crenWidth * 1.2, bodyY - towerHeight * 0.3 - crenHeight, crenWidth, crenHeight);
  }

  // Central tower crenellations
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(centerX - towerWidth / 2 + i * crenWidth * 1.2, bodyY - towerHeight * 0.5 - crenHeight, crenWidth, crenHeight);
  }

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const filename = `./icons/icon-${size}x${size}.png`;
  fs.writeFileSync(filename, buffer);

  console.log(`✅ Created ${filename}`);
});

// Create favicon.ico (using 32x32 version)
console.log('🌟 Creating favicon.ico...');
const faviconCanvas = createCanvas(32, 32);
const faviconCtx = faviconCanvas.getContext('2d');

// Same design but scaled for favicon
const gradient = faviconCtx.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');

faviconCtx.fillStyle = gradient;
faviconCtx.fillRect(0, 0, 32, 32);

// Simple castle for favicon
faviconCtx.fillStyle = 'white';
faviconCtx.fillRect(8, 16, 16, 12);
faviconCtx.fillRect(6, 12, 4, 16);
faviconCtx.fillRect(22, 12, 4, 16);
faviconCtx.fillRect(14, 10, 4, 18);

const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync('./favicon.png', faviconBuffer);

console.log('✅ Created favicon.png');
console.log('🎉 All icons generated successfully!');
console.log('\nGenerated files:');
sizes.forEach(size => {
  console.log(`  📱 icon-${size}x${size}.png`);
});
console.log('  🌟 favicon.png');
