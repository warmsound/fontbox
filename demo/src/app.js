const CANVAS_SIZE = 120;
const FONT_SIZE = CANVAS_SIZE; // Font height in px ~= font size in pt.
const MARGIN = 10;
const GLYPH = 'a';

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
		//ctx.fillRect(30, 30, 60, 60);

		let glyphData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		let w = glyphData.width;
		let h = glyphData.height;

		// Reduce glyphData to array of alpha channel values.
		let glyphPixels = glyphData.data.filter((element, index, array) => !((index - 3) % 4));
		let bgDistPixels = new Array(glyphPixels.length);		
		
		let maxBgDist = this.calcBgDist(glyphPixels, bgDistPixels, w, h);
		this.drawBgDist(bgDistPixels, w, h, maxBgDist);

		let localMaximaPixels = new Array(glyphPixels.length);
		let maximaFreq = this.calcLocalMaxima(bgDistPixels, localMaximaPixels, w, h);
		this.drawLocalMaxima(localMaximaPixels, w, h, maxBgDist);
		this.drawMaximaFreq(maximaFreq, w, h);
	}

	calcBgDist(src, dst, w, h) {
		const ROOT_2 = Math.pow(2, 0.5);

		let maxDist = 0;

		let i; // Index for pixel at (x, y).
		let j; // Index for search pixel.
		let bgFound;

		for (let y = 0; y < h; ++y) {
			for (let x = 0; x < w; ++x) {
				i = x + (y * w);
				bgFound = false;

				// If pixel is not fully transparent.
				if (src[i]) {

					// Determine minimum pixel distance from fully transparent background pixel.
					let dist = CANVAS_SIZE;
					for (let d = 1; d < dist; ++d) {

						// Search north: (x, y - d).
						j = x + ((y - d) * w);
						if ((y - d) < 0 || src[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search north-east: (x + d, y - d).
						j = (x + d) + ((y - d) * w);
						if ((x + d) >= w || (y - d) < 0 || src[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}

						// Search east: (x + d, y).
						j = (x + d) + (y * w);
						if ((x + d) >= w || src[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search south-east: (x + d, y + d).
						j = (x + d) + ((y + d) * w);
						if ((x + d) >= w || (y + d) >= h || src[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}

						// Search south: (x, y + d).
						j = x + ((y + d) * w);
						if (((y + d) >= h) || src[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search south-west: (x - d, y + d).
						j = (x - d) + ((y + d) * w);
						if ((x - d) < 0 || (y + d) >= h || src[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}

						// Search west: (x - d, y).
						j = (x - d) + (y * w);
						if (((x - d) < 0) || src[j] == 0) {
							dist = Math.min(dist, d);
							bgFound = true;
						}

						// Search north-west: (x - d, y - d).
						j = (x - d) + ((y - d) * w);
						if ((x - d) < 0 || (y - d) >= h || src[j] == 0) {
							dist = Math.min(dist, d * ROOT_2);
							bgFound = true;
						}
					}

					// Background or edge was found.
					// Write fully-opaque greyscale value that represents distance of pixel from background.
					if (bgFound) {
						dst[i] = dist;
						maxDist = Math.max(dist, maxDist);
					}
				}
			}
		}

		return maxDist;
	}

	drawBgDist(pixels, w, h, max) {
		let ctx = document.getElementById('bg-dist-canvas').getContext('2d');
		let data = ctx.createImageData(w, h);
		for (let i = 0; i < pixels.length; ++i) {
			data.data[(4 * i) + 0] = data.data[(4 * i) + 1] = data.data[(4 * i) + 2] = (pixels[i] / max) * 255;
			data.data[(4 * i) + 3] = 255;
		}
		ctx.putImageData(data, 0, 0);
	}

	calcLocalMaxima(src, dst, w, h) {
		let localMaxima = [];

		let i; // Index for pixel at (x, y).
		let j; // Index for search pixel.

		// x and y are pixel co-ords. Traverse each row before moving down to next.
		for (let y = 0; y < h; ++y) {
			for (let x = 0; x < w; ++x) {
				i = x + (y * w);

				// If pixel is not fully transparent.
				if (src[i]) {

					// Search north: (x, y - 1).
					j = x + ((y - 1) * w);
					if ((y - 1) >= 0 && src[j] > src[i]) {
						continue;
					}

					// Search north-east: (x + 1, y - 1).
					j = (x + 1) + ((y - 1) * w);
					if ((x + 1) < w && (y - 1) >= 0 && src[j] > src[i]) {
						continue;
					}

					// Search east: (x + 1, y).
					j = (x + 1) + (y * w);
					if ((x + 1) < w && src[j] > src[i]) {
						continue;
					}

					// Search south-east: (x + 1, y + 1).
					j = (x + 1) + ((y + 1) * w);
					if ((x + 1) < w && (y + 1) < h && src[j] > src[i]) {
						continue
					}

					// Search south: (x, y + 1).
					j = x + ((y + 1) * w);
					if (((y + 1) < h) && src[j] > src[i]) {
						continue;
					}

					// Search south-west: (x - 1, y + 1).
					j = (x - 1) + ((y + 1) * w);
					if ((x - 1) >= 0 && (y + 1) < h && src[j] > src[i]) {
						continue
					}

					// Search west: (x - 1, y).
					j = (x - 1) + (y * w);
					if (((x - 1) >= 0) && src[j] > src[i]) {
						continue;
					}

					// Search north-west: (x - 1, y - 1).
					j = (x - 1) + ((y - 1) * w);
					if ((x - 1) >= 0 && (y - 1) < h && src[j] > src[i]) {
						continue;
					}

					dst[i] = src[i];
					localMaxima.push(src[j]);
				}
			}
		}

		let maximaFreq = {};
		localMaxima.forEach(maxima => {
			maxima = Math.round(maxima);
			maximaFreq[maxima] = maximaFreq[maxima] ? maximaFreq[maxima] + 1 : 1;
		});
		console.log(maximaFreq);
		return maximaFreq;
	}

	drawLocalMaxima(pixels, w, h, max) {
		let ctx = document.getElementById('local-maxima-canvas').getContext('2d');
		let data = ctx.createImageData(w, h);
		for (let i = 0; i < pixels.length; ++i) {
			data.data[(4 * i) + 0] = data.data[(4 * i) + 1] = data.data[(4 * i) + 2] = (pixels[i] / max) * 255;
			data.data[(4 * i) + 3] = 255;
		}
		ctx.putImageData(data, 0, 0);
	}

	drawMaximaFreq(maximaFreq, w, h) {
		let ctx = document.getElementById('maxima-freq-canvas').getContext('2d');
		ctx.fillStyle = "#ffffff";

		let xValues = Object.keys(maximaFreq);
		let maxX = Math.max(...xValues);
		let maxY = Math.max(...Object.values(maximaFreq));
		let colWidth = w / (maxX + 1);
		let yValue;

		for (let i = 1; i <= maxX; ++i) {
			yValue = maximaFreq[i];
			if (yValue) {
				ctx.fillRect(colWidth * i, h - ((yValue / maxY) * h), colWidth, (yValue / maxY) * h);
			}
		}		
	}
}

new Demo();
