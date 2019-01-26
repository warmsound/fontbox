const CANVAS_SIZE = 120;
const FONT_SIZE = CANVAS_SIZE; // Font height in px ~= font size in pt.
const MARGIN = 10;
const GLYPH = 'E';

class Demo {

	constructor() {
		document.querySelectorAll('canvas').forEach(canvas => {
			canvas.width = canvas.height = CANVAS_SIZE;
		});

		this.drawGlyph();
	}
	
	drawGlyph() {
		let ctx = document.getElementById('glyph-canvas').getContext('2d');
		ctx.font = `${FONT_SIZE}pt Times New Roman`;
		ctx.fillStyle = "#ffffff";

		ctx.fillText(
			GLYPH,
			(CANVAS_SIZE - ctx.measureText(GLYPH).width) / 2,
			CANVAS_SIZE - MARGIN);
		// ctx.fillRect(30, 30, 60, 60)

		let glyphPixels = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		let bgDistPixels = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
		this.calcBgDist(glyphPixels, bgDistPixels);
		this.drawBgDist(bgDistPixels);
	}

	calcBgDist(src, dst) {
		let s = src.data;
		let d = dst.data;

		const row = (src.width * 4);

		// For each pixel.
		for (let i = 0; i < s.length; i += 4) {

			// If not fully transparent.
			if (s[i + 3]) {

				// Determine minimum axis-aligned distance from background (fully transparent pixel).
				let j;
				let dist = CANVAS_SIZE;

				// Search left.
				for (j = i - 4; ; j -= 4) {

					// If reached edge, or pixel is fully transparent.
					if ((j < 0) || (s[j + 3] == 0)) {
						dist = i - j;
						break;
					}
				}
				
				// Search right. Stop if we reach existing dist.
				for (j = i + 4; (j - i) < dist; j += 4) {

					// If reached edge, or pixel is fully transparent.
					if ((j >= s.length) || (s[j + 3] == 0)) {
						dist = j - i;
						break;
					}
				}
				
				// Search up. Stop if we reach existing dist.
				for (j = i - row; ((i - j) / src.width) < dist; j -= row) {

					// If reached edge, or pixel is fully transparent.
					if ((j < 0) || (s[j + 3] == 0)) {
						dist = ((i - j) / src.width);
						break;
					}
				}

				// Search down. Stop if we reach existing dist.
				for (j = i + row; ((j - i) / src.width) < dist; j += row) {

					// If reached edge, or pixel is fully transparent.
					if ((j >= s.length) || (s[j + 3] == 0)) {
						dist = ((j - i) / src.width);
						break;
					}
				}

				// Write fully-opaque greyscale value that represents distance of pixel from background.
				d[i] = d[i + 1] = d[i + 2] = dist * 5;
				d[i + 3] = 255;
			}
		}
	}

	drawBgDist(pixels) {
		let ctx = document.getElementById('bg-dist-canvas').getContext('2d');
		ctx.putImageData(pixels, 0, 0);
	}
}

new Demo();
