import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG vectoriel haute définition du logo MY-Wallet
// Correspond exactement à l'icône de l'application : 
// - squircle blanc avec coins arrondis doux
// - contour dégradé émeraude / teal / ambre doré
// - symbole central portefeuille vert émeraude
const createSvg = (size = 512, isMaskable = false) => {
  // Pour le format maskable PWA, on ajoute une marge de sécurité (safe zone 80%)
  const padding = isMaskable ? size * 0.12 : size * 0.04;
  const innerSize = size - padding * 2;
  const rx = innerSize * 0.26; // Coins arrondis modernes type iOS / Android OneUI

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <!-- Dégradé de la bordure : émeraude/teal vers ambre doré -->
    <linearGradient id="brandBorder" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="35%" stop-color="#10b981" />
      <stop offset="70%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <!-- Ombre douce sous l'icône -->
    <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-color="#059669" flood-opacity="0.22" />
      <feDropShadow dx="0" dy="${size * 0.04}" stdDeviation="${size * 0.06}" flood-color="#000000" flood-opacity="0.12" />
    </filter>

    <!-- Dégradé interne pour le relief du portefeuille -->
    <linearGradient id="walletStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>

  <!-- Fond plein pour maskable icon (safe-area 80% pour Android/Samsung/Pixel) -->
  ${isMaskable ? `<rect width="${size}" height="${size}" fill="#ffffff" />` : ''}

  <!-- Conteneur externe de l'icône avec dégradé -->
  <g filter="${isMaskable ? '' : 'url(#cardShadow)'}">
    <!-- Rectangle de bordure dégradée -->
    <rect 
      x="${padding}" 
      y="${padding}" 
      width="${innerSize}" 
      height="${innerSize}" 
      rx="${rx}" 
      ry="${rx}" 
      fill="url(#brandBorder)" 
    />
    
    <!-- Rectangle intérieur blanc pur (laisse apparaître le dégradé comme bordure de 4.5%) -->
    <rect 
      x="${padding + innerSize * 0.045}" 
      y="${padding + innerSize * 0.045}" 
      width="${innerSize * 0.91}" 
      height="${innerSize * 0.91}" 
      rx="${rx * 0.88}" 
      ry="${rx * 0.88}" 
      fill="#ffffff" 
    />
  </g>

  <!-- Symbole du portefeuille au centre (lucide wallet tracé précis et épuré) -->
  <g transform="translate(${size / 2}, ${size / 2}) scale(${innerSize * 0.022}) translate(-12, -12)">
    <!-- Tracé du portefeuille -->
    <path 
      d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" 
      fill="none" 
      stroke="url(#walletStroke)" 
      stroke-width="2.1" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />
    <path 
      d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" 
      fill="none" 
      stroke="url(#walletStroke)" 
      stroke-width="2.1" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
    />
    <!-- Bouton/fermoir du rabat -->
    <circle cx="16.5" cy="12.5" r="0.75" fill="#10b981" />
  </g>
</svg>`;
};

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Génération des icônes MY-Wallet...');

  // 1. Sauvegarde du SVG standard (utilisé pour le favicon et les navigateurs modernes)
  const svgContent = createSvg(512, false);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('✓ public/favicon.svg généré');

  // 2. Génération des PNG de haute fidélité
  const sizes = [
    { name: 'pwa-192x192.png', size: 192, maskable: false },
    { name: 'pwa-512x512.png', size: 512, maskable: false },
    { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'favicon-32x32.png', size: 32, maskable: false },
    { name: 'favicon-16x16.png', size: 16, maskable: false },
  ];

  for (const item of sizes) {
    const svgForSize = createSvg(item.size, item.maskable);
    const destPath = path.join(publicDir, item.name);
    await sharp(Buffer.from(svgForSize))
      .resize(item.size, item.size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(destPath);
    console.log(`✓ ${item.name} (${item.size}x${item.size}) généré`);
  }

  console.log('Toutes les icônes PWA et mobiles ont été créées avec succès !');
}

generate().catch((err) => {
  console.error('Erreur lors de la génération :', err);
  process.exit(1);
});
