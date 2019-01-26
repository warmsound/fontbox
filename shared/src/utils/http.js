class HTTP {
	constructor() {
		this.xhr = new XMLHttpRequest();	
	}

	get(url) {
		return new Promise((resolve, reject) => {
			this.xhr.open('GET', url);
			this.xhr.onreadystatechange = () => {
				if (this.xhr.readyState == 4) {
					if (this.xhr.status == 200) {
						resolve(this.xhr.responseText);
					} else if (this.xhr.status >= 400) {
						reject(this.xhr.statusText);
					}
				}
			};
			this.xhr.send();
		});
	}
}

export { HTTP };
