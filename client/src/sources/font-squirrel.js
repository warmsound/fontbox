import { HTTP } from '../../../shared/src/utils/http.js';

const CLASSIFICATIONS_URL = 'http://www.fontsquirrel.com/api/classifications';
const FAMILIES_URL = 'http://www.fontsquirrel.com/api/fontlist/all';

class FontSquirrel {
	constructor() {
		this.getFonts();
	}

	getFonts() {
		new HTTP().get(CLASSIFICATIONS_URL).then(response => { console.log(JSON.parse(response)); });
		new HTTP().get(FAMILIES_URL).then(response => { console.log(JSON.parse(response)); });
	}
}

export { FontSquirrel };
