"use strict";
document.addEventListener("DOMContentLoaded", _ => {
	browser.storage.sync.get().then(options => {
		const form       = document.querySelector("#options");
		const add_intent = form.querySelector("#add_intent");
		const auth       = form.querySelector("#auth");
		const endpoint   = form.querySelector("#endpoint");

		add_intent.checked = options.add_intent || false;
		auth.value         = options.auth       || "";
		endpoint.value     = options.endpoint   || "";

		form.addEventListener("submit", ev => {
			ev.preventDefault();
			browser.storage.sync.set({
				add_intent: add_intent.checked,
				auth:       auth.value,
				endpoint:   endpoint.value,
			}).catch(console.log);
		});
	}).catch(e => {
		const pre = document.body.appendChild(document.createElement("pre"));
		pre.appendChild(document.createTextNode(e));
		throw e;
	});
});
