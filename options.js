"use strict";
document.addEventListener("DOMContentLoaded", _ => {
	browser.storage.sync.get().then(options => {
		const form     = document.querySelector("#options");
		const auth     = form.querySelector("#auth");
		const endpoint = form.querySelector("#endpoint");

		auth.value     = options.auth     || "";
		endpoint.value = options.endpoint || "";

		form.addEventListener("submit", ev => {
			ev.preventDefault();
			browser.storage.sync.set({
				auth:     auth.value,
				endpoint: endpoint.value,
			}).catch(console.log);
		});
	}).catch(e => {
		const pre = document.body.appendChild(document.createElement("pre"));
		pre.appendChild(document.createTextNode(e));
		throw e;
	});
});
