#!/usr/bin/env python3
import argparse
from contextlib import contextmanager
import json
import sys

from bottle     import Bottle, abort, request, response
from cheroot    import wsgi
from youtube_dl import YoutubeDL

class YtdlMultiApp(object):
	def __init__(self, **kwargs):
		self._kwargs = kwargs

	def __call__(self, *args, **kwargs):
		with YoutubeDL(self._kwargs) as ytdl:
			app = Bottle()

			@app.get('/')
			def _():
				if 'u' not in request.query:
					abort(400, "missing argument 'u'")
				url = request.query.u
				response.content_type = 'text/plain; charset=utf-8'
				info = ytdl.extract_info(url, download=False)
				return json.dumps(info, separators=(',', ': '), indent='\t') + '\n'

			return app(*args, **kwargs)

def parse_address(addr):
	if addr.startswith('unix:'):
		return addr[5:]

	addr = addr.rsplit(':', 1)
	if len(addr) == 1:
		addr.insert(0, '127.0.0.1')
	elif not addr[0]:
		addr[0] = '127.0.0.1'
	addr[1] = int(addr[1], 10)
	return tuple(addr)

def thread_count(arg):
	n = int(arg)
	if n < 1:
		raise ValueError('')
	return n

def main():
	p = argparse.ArgumentParser(description='HTTP server that extracts information with youtube-dl')
	p.add_argument('--listen',  '-l', type=parse_address, default='127.0.0.1:8000', help='listen address (default: 127.0.0.1:8000)')
	p.add_argument('--threads', '-j', type=thread_count,  default=10,               help='number of threads (default: 10)')
	args = p.parse_args()

	app    = YtdlMultiApp(verbose=True)
	server = wsgi.Server(args.listen, app, args.threads)
	print('listening on %r...' % (args.listen,), file=sys.stderr)
	try:
		server.start()
	finally:
		server.stop()

if __name__ == '__main__':
	sys.exit(main() or 0)
