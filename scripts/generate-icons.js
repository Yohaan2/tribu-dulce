const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateMaskableIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const sourceLogo = path.join(publicDir, 'tribu-logo.png');

  if (!fs.existsSync(sourceLogo)) {
    console.error('No se encontró public/tribu-logo.png');
    return;
  }

  // Color de fondo rosa del logo de Tribu Dulce
  const bgColor = { r: 214, g: 120, b: 121, alpha: 1 }; // #d67879

  // Tamaños a generar
  const sizes = [16, 32, 192, 512];

  for (const size of sizes) {
    const targetFile = path.join(publicDir, size <= 32 ? `icon-${size}x${size}.png` : `icon-${size}x${size}.png`);

    // Para iconos adaptativos (maskable), la zona segura (safe zone) es el 80% central (diámetro del círculo de seguro)
    // Así que escalamos la imagen original al 85-90% del lienzo cuadrado
    const logoSize = Math.round(size * 0.88);

    const resizedLogo = await sharp(sourceLogo)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bgColor,
      },
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(targetFile);

    console.log(`Generado ícono ${size}x${size} en ${targetFile}`);
  }
}

generateMaskableIcons().catch((err) => {
  console.error('Error generando íconos:', err);
});
