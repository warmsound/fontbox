import { GoogleFonts } from './sources/google-fonts.js';
import { FontSquirrel } from './sources/font-squirrel.js';

class FontBox {
	constructor() {
		new GoogleFonts();
		new FontSquirrel();

		let fontInputElement = document.getElementById('font-input');
		fontInputElement.addEventListener('change', event => {
			let file = event.target.files[0];

			let reader = new FileReader();
			reader.addEventListener('load', event => {
				let font = opentype.parse(event.target.result);
				console.log(font);
			});
			reader.readAsArrayBuffer(file);
		});
	}
}

new FontBox();
