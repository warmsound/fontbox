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

		const row = (src.width * 4);
		const ROOT_2 = Math.pow(2, 0.5);

		// x and y are pixel co-ords. Traverse each row before moving down to next.
		for (let y = 0; y < src.height; ++y) {
			for (let x = 0; x < src.width; ++x) {

				// i is index into pixel data array for pixel at (x, y).
				let i = ((y * src.width) + x) * 4;

				// j is index into pixel data array for search pixel.
				let j;

				let bgFound = false;

				// If pixel is not fully transparent.
				if (s[i + 3]) {

					// Determine minimum pixel distance from fully transparent background pixel.
					let dist = CANVAS_SIZE;
					for (let d = 1; d < dist; ++d) {

						// Search north: (x, y - d).
						j = (((y - d) * src.width) + x) * 4;
						if ((y - d) < 0 || s[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search north-east: (x + d, y - d).
						j = (((y - d) * src.width) + x + d) * 4;
						if ((x + d) >= src.width || (y - d) < 0 || s[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}

						// Search east: (x + d, y).
						j = ((y * src.width) + x + d) * 4;
						if ((x + d) >= src.width || s[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search south-east: (x + d, y + d).
						j = (((y + d) * src.width) + x + d) * 4;
						if ((x + d) >= src.width || (y + d) >= src.height || s[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}

						// Search south: (x, y + d).
						j = (((y + d) * src.width) + x) * 4;
						if (((y + d) >= src.height) || s[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search south-west: (x - d, y + d).
						j = (((y + d) * src.width) + x - d) * 4;
						if ((x - d) < 0 || (y + d) >= src.height || s[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}

						// Search west: (x - d, y).
						j = ((y * src.width) + x - d) * 4;
						if (((x - d) < 0) || s[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search north-west: (x - d, y - d).
						j = (((y - d) * src.width) + x - d) * 4;
						if ((x - d) < 0 || (y - d) >= src.height || s[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}
					}

					// Background or edge was found.
					// Write fully-opaque greyscale value that represents distance of pixel from background.
					if (bgFound) {
						dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = dist * 16;
						dst.data[i + 3] = 255;
					}
				}
			}
		}
	}

	drawBgDist(pixels) {
		let ctx = document.getElementById('bg-dist-canvas').getContext('2d');
		ctx.putImageData(pixels, 0, 0);
	}
}

new Demo();
