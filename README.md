# youtube-dl info

youtube-dl info is a WebExtension that uses youtube-dl behind a simple
WSGI/HTTP server to extract information about media streams in a browser's
webpage.

This WebExtension also works on [Firefox for Android](https://www.mozilla.org/firefox/mobile)
and can optionally create `intent:` URI to open the page's videos in [VLC media
player](https://f-droid.org/packages/org.videolan.vlc/).

## Configuration

Setup `ytdl.py` to run behind a reverse proxy like nginx and insert the URL
in the WebExtension's option *youtube-dl Endpoint*. Additionally configure
some sort of authentication to disallow others from using your youtube-dl info
server.
