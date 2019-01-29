import { FontAnalyser } from '../../shared/src/font-analyser.js';

const FONT_FACE = 'Times New Roman';

class Demo {

	constructor() {
		let results = new FontAnalyser(FONT_FACE, { canvas: document.getElementById('glyph-canvas')}).analyse();
		console.log(results);

		let raw = results.raw;
		let maxBgDist = raw.maxBgDist;
		this.drawImageData(document.getElementById('bg-dist-canvas'), raw.bgDistImageData, raw.width, raw.height, maxBgDist);
		this.drawImageData(document.getElementById('local-maxima-canvas'), raw.maximaImageData, raw.width, raw.height, maxBgDist);
		this.drawMaximaFreq(raw.maximaImageData)
	}

	drawImageData(canvas, values, w, h, maxValue) {
		canvas.width = w;
		canvas.height = h;

		let ctx = canvas.getContext('2d');
		let data = ctx.createImageData(w, h);

		for (let i = 0; i < values.length; ++i) {
			data.data[(4 * i) + 0] = data.data[(4 * i) + 1] = data.data[(4 * i) + 2] = (values[i] / maxValue) * 255;
			data.data[(4 * i) + 3] = 255;
		}
		ctx.putImageData(data, 0, 0);
	}

	drawMaximaFreq(values) {

		// Calculate frequency table.
		let maximaFreq = {};
		values.forEach(value => {
			value = Math.floor(value);
			maximaFreq[value] = maximaFreq[value] ? maximaFreq[value] + 1 : 1;
		});

		let w = 120;
		let h = 120;
		let canvas = document.getElementById('maxima-freq-canvas');
		canvas.width = w;
		canvas.height = h;

		let ctx = canvas.getContext('2d');
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
