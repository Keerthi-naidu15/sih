import fs from 'fs';
import sharp from 'sharp';

const svgBuffer = fs.readFileSync('./public/leaf.svg');
const sizes = [16, 32, 48, 180, 192, 512];

async function generate() {
    for (const size of sizes) {
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(`./public/pwa-${size}.png`);
        console.log(`Generated pwa-${size}.png`);
    }
}
generate().catch(console.error);
