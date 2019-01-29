

class FontAnalyser {
	constructor(fontFace, config = {}) {
		this.fontFace = fontFace;
		this.config = Object.assign({
			fontSize: 120,
			canvasAspectRatio: 0.5, // width/height
			widthString: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
			xHeightGlyph: 'x',
			contrastGlyph: 'o'
		}, config);
		
		this.canvas = this.config.canvas || (document && document.createElement('canvas'));
		if (!this.canvas) {
			throw 'Failed to create canvas!';	
		}
		this.ctx = this.canvas.getContext('2d');
	}

	analyse() {

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// Average character width.
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		this.ctx.font = `${this.config.fontSize}pt ${this.fontFace}`;
		let avgCharWidth = this.ctx.measureText(this.config.widthString).width / this.config.widthString.length;

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// X-height.
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		this.drawGlyph(this.config.xHeightGlyph);
		let { height: xHeight } = this.getBounds();

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// Weight, contrast.
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		this.drawGlyph(this.config.contrastGlyph);
		let { left, top, width, height } = this.getBounds();

		let rgbaImageData = this.ctx.getImageData(left, top, width, height);
		let greyImageData = rgbaImageData.data.filter((element, index, array) => !((index - 3) % 4)); // Elements 3, 7, 11 etc.

		let bgDistImageData = new Array(width * height);
		let maxBgDist = this.calcBgDist(greyImageData, bgDistImageData, width, height);

		let maximaImageData = new Array(width * height);
		let maxima = this.calcLocalMaxima(bgDistImageData, maximaImageData, width, height);

		let maximaStats = this.calcMaximaStats(maxima);

		return {
			metrics: {
				avgCharWidth,
				xHeight,
				averageWeight: maximaStats.averageWeight,
				contrast: maximaStats.contrast
			},
			raw: {
				width,
				height,				
				bgDistImageData,
				maxBgDist,
				maximaImageData,
				maxima
			}
		};
	}

	drawGlyph(glyph) {
		let ctx = this.ctx;

		// Measure text width, fit canvas width to text. Unable to measure height easily, so allow ample canvas height.
		let glyphWidth = Math.ceil(ctx.measureText(glyph[0]).width);
		let stringWidth = Math.ceil(ctx.measureText(glyph).width); // In case multiple chars provided.
		this.canvas.width = stringWidth;
		this.canvas.height = Math.ceil(glyphWidth / this.config.canvasAspectRatio);

		// Draw text top aligned at origin to minimise risk of truncating text vertically.
		this.ctx.font = `${this.config.fontSize}pt ${this.fontFace}`;
		ctx.fillStyle = '#ffffff';
		ctx.textBaseline = 'top';
		ctx.fillText(glyph, 0, 0);
	}

	getBounds() {
		let bounds = {};

		let d = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		let x, y, i;

		// Left bound: test columns from left edge.
		for (x = 0; x < d.width; ++x) {
			for (y = 0; y < d.height; ++y) {
				i = ((x + (y * d.width)) * 4) + 3; // Index in RGBA pixel data of A channel for pixel at (x, y).
				if (d.data[i]) { // Non-transparent pixel found.
					bounds.left = x;
					break;
				}
			}
			if (bounds.left !== undefined) {
				break;
			}
		}

		// Right bound: test columns from right edge.
		for (x = d.width; x >= 0; --x) {
			for (y = 0; y < d.height; ++y) {
				i = ((x + (y * d.width)) * 4) + 3;
				if (d.data[i]) {
					bounds.right = x;
					break;
				}
			}
			if (bounds.right !== undefined) {
				break;
			}
		}

		// Top bound: test rows from top edge.
		for (y = 0; y < d.height; ++y) {
			for (x = 0; x < d.width; ++x) {
				i = ((x + (y * d.width)) * 4) + 3;
				if (d.data[i]) {
					bounds.top = y;
					break;
				}
			}
			if (bounds.top !== undefined) {
				break;
			}
		}

		// Bottom bound: test rows from bottom edge.
		for (y = d.height; y > 0; --y) {
			for (x = 0; x < d.width; ++x) {
				i = ((x + (y * d.width)) * 4) + 3;
				if (d.data[i]) {
					bounds.bottom = y;
					break;
				}
			}
			if (bounds.bottom !== undefined) {
				break;
			}
		}

		bounds.width = bounds.right - bounds.left;
		bounds.height = bounds.bottom - bounds.top;

		return bounds;
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
							dist = Math.min(dist, this.getPixelBgDist(src, w, h, x, dx, y, dy));
						}

						// Right.
						for (dx = r, dy = -r; dy < r; ++dy) {
							dist = Math.min(dist, this.getPixelBgDist(src, w, h, x, dx, y, dy));
						}

						// Bottom.
						for (dx = r, dy = r; dx > -r; --dx) {
							dist = Math.min(dist, this.getPixelBgDist(src, w, h, x, dx, y, dy));
						}

						// Left.
						for (dx = -r, dy = r; dy > -r; --dy) {
							dist = Math.min(dist, this.getPixelBgDist(src, w, h, x, dx, y, dy));
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

	getPixelBgDist(src, w, h, x, dx, y, dy) {
		let dist = Infinity;

		let isPixelInBounds = this.isPixelInBounds(w, h, x, dx, y, dy);

		// If pixel is out of bounds, or is background.
		if (!isPixelInBounds || src[(x + dx) + ((y + dy) * w)] == 0) {

			// Return pythagorean distance of test pixel from current
			dist = Math.pow((dx * dx) + (dy * dy), 0.5);
		}

		return dist;
	}

	isPixelInBounds(w, h, x, dx, y, dy) {
		return (x + dx) >= 0 &&
			(x + dx) < w &&
			(y + dy) >= 0 &&
			(y + dy) < h;
	}

	calcLocalMaxima(src, dst, w, h) {
		let localMaxima = [];

		let i; // Index for pixel at (x, y).

		// x and y are pixel co-ords. Traverse each row before moving down to next.
		for (let y = 0; y < h; ++y) {
			for (let x = 0; x < w; ++x) {
				i = x + (y * w);

				// If pixel is not fully transparent.
				if (src[i]) {

					// Test north: (x, y - 1).
					if (this.isNeighbourPixelBrighter(src, w, h, x, 0, y, -1, i)) {
						continue;
					}

					// Test east: (x + 1, y).
					if (this.isNeighbourPixelBrighter(src, w, h, x, +1, y, 0, i)) {
						continue;
					}

					// Test south: (x, y + 1).
					if (this.isNeighbourPixelBrighter(src, w, h, x, 0, y, +1, i)) {
						continue;
					}

					// Test west: (x - 1, y).
					if (this.isNeighbourPixelBrighter(src, w, h, x, -1, y, 0, i)) {
						continue;
					}

					dst[i] = src[i];
					localMaxima.push(src[i]);
				}
			}
		}

		return localMaxima;
	}

	isNeighbourPixelBrighter(src, w, h, x, dx, y, dy, i) {
		if (this.isPixelInBounds(w, h, x, dx, y, dy)) {
			let j = (x + dx) + ((y + dy) * w); // Index for test pixel.
			return (src[j] > src[i]);
		}
		return false;
	}

	calcMaximaStats(maxima) {
		let sum = maxima.reduce((accumulator, currentValue) => accumulator + currentValue);
		let mean = sum / maxima.length;

		let squaredDiffs = maxima.map(value => Math.pow(value - mean, 2));
		let sumSquaredDiffs = squaredDiffs.reduce((accumulator, currentValue) => accumulator + currentValue);
		let variance = sumSquaredDiffs / squaredDiffs.length;
		let stdDev = Math.pow(variance, 0.5);

		return {
			averageWeight: mean * 2,
			contrast: stdDev
		};
	}
}

export { FontAnalyser };
