#!/usr/bin/env python3
import argparse
from contextlib import contextmanager
import json
import sys

import bjoern
from bottle import Bottle, abort, request, response
from youtube_dl import YoutubeDL

@contextmanager
def ytdl_app(**kwargs):
	with YoutubeDL(kwargs) as ytdl:
		app = Bottle()

		@app.get('/')
		def _():
			if 'u' not in request.query:
				abort(400, "missing argument 'u'")
			url = request.query.u
			response.content_type = 'text/plain; charset=utf-8'
			info = ytdl.extract_info(url, download=False)
			return json.dumps(info, separators=(',', ': '), indent='\t')

		yield app

def parse_address(addr):
	if addr.startswith('unix:'):
		return (addr,)

	addr = addr.rsplit(':', 1)
	if len(addr) == 1:
		addr.insert(0, '127.0.0.1')
	elif not addr[0]:
		addr[0] = '127.0.0.1'
	addr[1] = int(addr[1], 10)
	return tuple(addr)

def main():
	p = argparse.ArgumentParser(description='HTTP server that runs extracts information with youtube-dl')
	p.add_argument('--listen', '-l', type=parse_address, default='127.0.0.1:8000', help='listen address')
	args = p.parse_args()

	with ytdl_app(verbose=True) as app:
		print('listening on %r...' % (args.listen,), file=sys.stderr)
		bjoern.run(app, *args.listen)

if __name__ == '__main__':
	sys.exit(main() or 0)
