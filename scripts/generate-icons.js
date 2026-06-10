const sharp = require('sharp');
const path = require('path');

const src = 'C:\\Users\\akash\\.gemini\\antigravity\\brain\\82ba14fb-5d30-4b76-bac0-526ed8dc4327\\pokeus_icon_1781057437049.png';
const sizes = [72, 96, 128, 144, 192, 512];

Promise.all(
  sizes.map(s =>
    sharp(src)
      .resize(s, s)
      .png()
      .toFile(path.join('public', 'icons', `icon-${s}.png`))
  )
).then(() => {
  console.log('All icons generated successfully!');
}).catch(err => {
  console.error('Error generating icons:', err.message);
  process.exit(1);
});
