"use strict";
function quote_plus(x) {
	return encodeURIComponent(x).split("%20").join("+");
}
function unquote_plus(x) {
	return decodeURIComponent(x.split("+").join("%20"));
}

function new_text(txt) {
	return document.createTextNode(txt);
}
function new_tag(tag, attrs) {
	const e = document.createElement(tag);
	for(const attr in attrs || {}) {
		if(attrs.hasOwnProperty(attr)) {
			e.setAttribute(attr, attrs[attr]);
		}
	}
	return e;
}

HTMLElement.prototype.add_text = function(txt)        { return this.appendChild(new_text(txt));       };
HTMLElement.prototype.add_tag  = function(tag, attrs) { return this.appendChild(new_tag(tag, attrs)); };

function show_error(e) {
	document.title = "error";
	const body = document.querySelector("#error");
	body.add_tag("h1").add_text("youtube-dl info error");
	body.add_text(e);
	if(e.stack) {
		body.add_tag("pre").add_text(e.stack);
	}
	if(e.more) {
		body.appendChild(e.more);
	}
	document.body.setAttribute("class", "error");
}

function fetch_youtubedl_info(url) {
	browser.storage.sync.get()
		.then(({add_intent, auth, endpoint}) => {
			const req_url  = (endpoint || "http://127.0.0.1:8000/") + "?u=" + quote_plus(url);
			const headers  = {};
			const req_info = {
				credentials:    "omit",
				referrerPolicy: "no-referrer",
				headers:        headers,
			};
			if(auth) {
				headers["Authorization"] = auth;
			}

			document.querySelector("#loading").add_tag("a", {"href": req_url}).add_text(req_url);
			document.body.setAttribute("class", "loading");

			return fetch(req_url, req_info)
				.then(resp => resp.ok
					? resp.json()
					: resp.text().then(txt => {
						const e = new Error(`${resp.status} ${resp.statusText}`);
						e.more = new_tag("pre");
						e.more.add_text(txt);
						throw e;
					})
				)
				.then(info => {
					dump_info(info, add_intent);
				});
		})
		.catch(show_error);
}

function uploader_link(data) {
	if(!data.uploader || !data.uploader_url) {
		return null;
	}
	const a = new_tag("a");
	a.setAttribute("href", data.uploader_url);
	a.add_text(data.uploader);
	return a;
}

function dump_m3u(data) {
	let m3u = "#EXTM3U\n";
	for(const video of data.entries) {
		if(video.title) {
			m3u += "#EXTINF:-1," + video.title;
			if(video.uploader) {
				m3u += " - " + video.uploader;
			}
			m3u += "\n";
		}
		m3u += video.webpage_url + "\n";
	}
	return m3u;
}

function format_filesize(size) {
	size = String(Math.round((size * 10) / 1024 / 1024));
	const n = size.length;
	return `${size.substr(0, n - 1)}.${size.substr(n - 1)} MiB`;
}

function vlc_intent_uri(url) {
	const m = url.match(/^([^:]*):\/\/([^#]*)/);
	if(!m) {
		return null;
	}
	return "intent://" + m[2]
			+ "#Intent;"
			+ "package=org.videolan.vlc;"
			+ "scheme=" + m[1] + ";"
			+ "type=video/*;"
			+ "end";
}

function dump_format_info(data, add_intent, title, uploader) {
	const root = new_tag("li");

	if(data.format) {
		root.add_text(data.format + " ");
	}

	root.add_tag("a", {href: data.url}).add_text("video");
	root.add_text("/");

	let embedded_url = "embed.xhtml?";
	if(title) {
		embedded_url += "t=" + quote_plus(title);
		if(uploader) {
			embedded_url += quote_plus(" \u2014 " + uploader);
		}
		embedded_url += "&";
	}
	embedded_url += "v=" + quote_plus(data.url);
	root.add_tag("a", {href: embedded_url}).add_text("embedded");

	if(add_intent) {
		const intent = vlc_intent_uri(data.url);
		if(intent) {
			root.add_text("/");
			root.add_tag("a", {href: intent}).add_text("VLC");
		}
	}

	if(data.filesize) {
		root.add_text(" " + format_filesize(data.filesize));
	}

	return root;
}

function dump_video_info(data, add_intent, body) {
	if(!body) {
		document.title = data.title || `video ${data.id}`;
		if(data.uploader) {
			document.title += " \u2014 " + data.uploader;
		}
	}
	body = body
		? body.add_tag("li")
		: document.querySelector("#info");

	const h2 = body.add_tag("h2");
	h2.add_tag("a", {href: data.webpage_url}).add_text(data.title || data.webpage_url);
	const uploader = uploader_link(data);
	if(uploader) {
		h2.add_text(" \u2014 ");
		h2.appendChild(uploader);
	}

	if(add_intent) {
		const intent = vlc_intent_uri(data.webpage_url);
		if(intent) {
			body.add_tag("a", {href: intent}).add_text("VLC");
		}
	}

	const ul = body.add_tag("ul", {"class": "formats"});
	(data.formats || [data])
		.map(fmt => dump_format_info(fmt, add_intent, data.title, data.uploader))
		.forEach(e => ul.appendChild(e));
}

function dump_playlist(data, add_intent) {
	document.title = data.title || `playlist ${data.id}`;
	if(data.uploader) {
		document.title += " \u2014 " + data.uploader;
	}
	const body = document.querySelector("#info");

	const h1 = body.add_tag("h1");
	h1.add_tag("a", {"href": data.webpage_url}).add_text(data.title || data.webpage_url);
	const uploader = uploader_link(data);
	if(uploader) {
		h1.add_text(" \u2014 ");
		h1.appendChild(uploader);
	}

	const videos = body.add_tag("ul", {"class": "videos"});
	data.entries.forEach(e => dump_video_info(e, add_intent, videos));

	body.add_tag("textarea", {"id": "m3u", "readonly": "yes"})
		.add_text(dump_m3u(data));
}

function dump_info(info, add_intent) {
	if(info._type == "playlist") {
		dump_playlist(info, add_intent);
	} else {
		dump_video_info(info, add_intent);
	}
	document.body.setAttribute("class", "info");
}

document.addEventListener("DOMContentLoaded", ev => {
	for(const arg of location.search.substr(1).split("&")) {
		if(arg.substr(0, 2) == "u=") {
			fetch_youtubedl_info(unquote_plus(arg.substr(2)));
			return;
		}
	}
	show_error(new Error("missing argument 'u'"));
});
