import { HTTP } from '../../../shared/src/utils/http.js';

const API_KEY = 'AIzaSyBPw7VNxTogwghmgggAp-_uQ9vaB7Jihqs';
const API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts?key=' + API_KEY;

class GoogleFonts {
	constructor() {
		this.getFonts();
	}

	getFonts() {
		let http = new HTTP();
		http.get(API_URL).then(response => { this.parseFonts(response); });
	}

	parseFonts(fontData) {
		let fonts = JSON.parse(fontData);

		let categories = _.uniq(fonts.items.map(item => item.category));
		console.log(categories);
		let families = fonts.items.map(item => item.family);
		console.log(families);
	}
}

export { GoogleFonts };
