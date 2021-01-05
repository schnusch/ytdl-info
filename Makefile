addon_files = \
	background.js \
	embed.js \
	embed.xhtml \
	info.js \
	info.xhtml \
	manifest.json \
	options.js \
	options.xhtml \
	style.css \
	youtube-dl.svg

zip: ytdl-info.zip
clean:
	$(RM) ytdl-info.zip

ytdl-info.zip: $(addon_files)
	7z a -tzip $@ $(addon_files)
