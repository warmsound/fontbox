const CANVAS_SIZE = 120;
const FONT_SIZE = CANVAS_SIZE; // Font height in px ~= font size in pt.
const FONT_FACE = 'Times New Roman';
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
		ctx.font = `${FONT_SIZE}pt ${FONT_FACE}`;
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
		let maxDist = 0;

		// For each pixel at (x, y).
		for (let y = 0; y < h; ++y) {
			for (let x = 0; x < w; ++x) {

				// If pixel is not transparent.
				let i = x + (y * w);
				if (src[i]) {

					// Determine minimum distance from background.
					// Perform rectangular laps of "radius" r around pixel at (x, y), starting at north-west, running clockwise.
					// Test pixel at (x + dx, y + dy).
					let dist = Infinity;
					let dx, dy;
					for (let r = 1; r < dist; ++r) {

						// Top.
						for (dx = -r, dy = -r; dx < r; ++dx) {
							dist = Math.min(dist, this.testPixel(src, w, h, x, dx, y, dy));
						}

						// Right.
						for (dx = r, dy = -r; dy < r; ++dy) {
							dist = Math.min(dist, this.testPixel(src, w, h, x, dx, y, dy));
						}

						// Bottom.
						for (dx = r, dy = r; -dx < r; --dx) {
							dist = Math.min(dist, this.testPixel(src, w, h, x, dx, y, dy));
						}

						// Left.
						for (dx = -r, dy = r; -dy < r; --dy) {
							dist = Math.min(dist, this.testPixel(src, w, h, x, dx, y, dy));
						}
					}

					// Background distance was found.
					// Write value into corresponding pixel in dst that represents distance of pixel from background.
					if (dist < Infinity) {
						dst[i] = dist;
						maxDist = Math.max(dist, maxDist);
					}
				}
			}
		}

		return maxDist;
	}

	testPixel(src, w, h, x, dx, y, dy) {
		//console.log(dx, dy);
		let dist = Infinity;

		let isPixelInBounds = (x + dx) >= 0 &&
			(x + dx) < w &&
			(y + dy) >= 0 &&
			(y + dy) < h;

		// If pixel is out of bounds, or is background.
		if (!isPixelInBounds || src[(x + dx) + ((y + dy) * w)] == 0) {

			// Return pythagorean distance of test pixel from current
			dist = Math.pow((dx * dx) + (dy * dy), 0.5);
		}

		return dist;
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
		let j; // Index for test pixel.

		// x and y are pixel co-ords. Traverse each row before moving down to next.
		for (let y = 0; y < h; ++y) {
			for (let x = 0; x < w; ++x) {
				i = x + (y * w);

				// If pixel is not fully transparent.
				if (src[i]) {

					// Test north: (x, y - 1).
					j = x + ((y - 1) * w);
					if ((y - 1) >= 0 && src[j] > src[i]) {
						continue;
					}

					// Test east: (x + 1, y).
					j = (x + 1) + (y * w);
					if ((x + 1) < w && src[j] > src[i]) {
						continue;
					}

					// Test south: (x, y + 1).
					j = x + ((y + 1) * w);
					if (((y + 1) < h) && src[j] > src[i]) {
						continue;
					}

					// Test west: (x - 1, y).
					j = (x - 1) + (y * w);
					if (((x - 1) >= 0) && src[j] > src[i]) {
						continue;
					}

					dst[i] = src[i];
					localMaxima.push(src[i]);
				}
			}
		}

		let maximaFreq = {};
		localMaxima.forEach(maxima => {
			maxima = Math.floor(maxima);
			maximaFreq[maxima] = maximaFreq[maxima] ? maximaFreq[maxima] + 1 : 1;
		});
		console.log('Frequency table', maximaFreq);

		let sum = localMaxima.reduce((accumulator, currentValue) => accumulator + currentValue);
		let mean = sum / localMaxima.length;
		console.log('Mean', mean);

		let squaredDiffs = localMaxima.map(value => Math.pow(value - mean, 2));
		let sumSquaredDiffs = squaredDiffs.reduce((accumulator, currentValue) => accumulator + currentValue);
		let variance = sumSquaredDiffs / squaredDiffs.length;
		let stdDev = Math.pow(variance, 0.5);
		console.log('Std dev', stdDev);

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
		let colWidth = Math.floor(w / (maxX + 1));
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
