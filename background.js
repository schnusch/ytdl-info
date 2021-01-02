"use strict";
function new_text(txt) {
	return document.createTextNode(txt);
}
function new_tag(tag, attrs) {
	const e = document.createElementNS("http://www.w3.org/1999/xhtml", tag);
	for(const attr in attrs || {}) {
		if(attrs.hasOwnProperty(attr)) {
			e.setAttribute(attr, attrs[attr]);
		}
	}
	return e;
}

HTMLElement.prototype.add_text = function(txt)        { return this.appendChild(new_text(txt));       };
HTMLElement.prototype.add_tag  = function(tag, attrs) { return this.appendChild(new_tag(tag, attrs)); };

function quote_plus(x) {
	return encodeURIComponent(x).split("%20").join("+");
}

function fetch_youtubedl_info(url) {
	const req_url  = "http://127.0.0.1:8000/?u=" + quote_plus(url);
	const req_info = {
		credentials:    "omit",
		referrerPolicy: "no-referrer",
		headers: {
			"Authorization": "Basic YWJjOmRlZgo=",
		},
	};
	return fetch(req_url, req_info).then(r => r.json()).then(data => {
		if(data._type === "playlist") {
			return dump_playlist(data);
		} else {
			return dump_video_info(data, true);
		}
	}).catch(error_page);
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
				m3u += " -- " + video.uploader;
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

function dump_format_info(data) {
	const root = new_tag("li");

	if(data.format) {
		root.add_text(data.format + " ");
	}

	root.add_tag("a", {href: data.url}).add_text("video");
	// TODO another link

	if(data.filesize) {
		root.add_text(" " + format_filesize(data.filesize));
	}

	return root;
}

function dump_video_info(data, is_root) {
	const html = new_tag("html");
//	html.add_tag("head").add_tag("title").add_text("video");
	const body = is_root ? html.add_tag("body") : new_tag("li");

	const h2 = body.add_tag("h2");
	h2.add_tag("a", {href: data.webpage_url}).add_text(data.title || data.webpage_url);
	const uploader = uploader_link(data);
	if(uploader) {
		h2.add_text(" -- ");
		h2.appendChild(uploader);
	}

	const ul = body.add_tag("ul");
	(data.formats || [data])
		.map(dump_format_info)
		.forEach(e => ul.appendChild(e));

	return is_root ? html : body;
}

function dump_playlist(data) {
	const html = new_tag("html");

	const head = html.add_tag("head");
	head.add_tag("title").add_text("playlist");
	head.add_tag("link", {rel: "icon", href: browser.runtime.getURL("youtube-dl.svg")});

	const body = html.add_tag("body");

	const h1 = body.add_tag("h1");
	h1.add_tag("a", {"href": data.webpage_url}).add_text(data.title || data.webpage_url);
	const uploader = uploader_link(data);
	if(uploader) {
		h1.add_text(" -- ");
		h1.appendChild(uploader);
	}

	const videos = body.add_tag("ul");
	data.entries
		.map(e => dump_video_info(e))
		.forEach(e => videos.appendChild(e));

	const e = body.add_tag("textarea", {readonly: "yes"});
	e.add_text(dump_m3u(data));

	return html;
}

function error_page(e) {
	const html = new_tag("html");

	const head = html.add_tag("head");
	head.add_tag("title").add_text("error");
	head.add_tag("link", {rel: "icon", href: browser.runtime.getURL("youtube-dl.svg")});

	const body = html.add_tag("body")
	body.add_tag("h1").add_text("youtube-dl info error");
	body.add_text(e);
	body.add_tag("pre").add_text(e.stack);

	return html;
}

browser.browserAction.onClicked.addListener(tab => {
	fetch_youtubedl_info(tab.url).then(page => {
		const html = new Blob(["<!DOCTYPE html>\n", page.outerHTML], {type: "text/html"});
		const url  = URL.createObjectURL(html);
		browser.tabs.create({
			openerTabId: tab.id,
			url:         url,
		});
	});
});
