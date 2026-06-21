const Jimp = require('jimp');

Jimp.read('public/logo.png').then(image => {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];

    // If pixel is mostly black (dark gray or black) and not fully transparent
    if (r < 50 && g < 50 && b < 50 && a > 0) {
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
    }
  });
  image.write('public/logo-white.png');
  console.log('Logo processed successfully!');
}).catch(err => {
  console.error(err);
});
