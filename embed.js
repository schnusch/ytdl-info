"use strict";
function unquote_plus(x) {
	return decodeURIComponent(x.split("+").join("%20"));
}

document.addEventListener("DOMContentLoaded", _ => {
	const video = document.querySelector("video");

	for(const arg of location.search.substr(1).split("&")) {
		if(arg.substr(0, 2) == "v=") {
			video.src = unquote_plus(arg.substr(2));
		} else if(arg.substr(0, 2) == "t=") {
			document.title = unquote_plus(arg.substr(2));
		}
	}
});
