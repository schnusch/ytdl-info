import argparse
import io
import json
import http.server
import logging
import socketserver
import sys
import traceback
import urllib.parse

from youtube_dl import YoutubeDL
from .xhtml import generate_info

class YtdlRequestHandler(http.server.BaseHTTPRequestHandler):
    logger = logging.getLogger('YtdlRequestHandler')

    def log_message(self, format, *args):
        self.logger.info(format, *args)

    def _extract_info(self, url):
        if not hasattr(self, 'ytdl'):
            self.logger.debug('initialize YoutubeDL')
            self.ytdl = YoutubeDL(self.server.ytdl_options)
        with self.ytdl:
            self.logger.info('extract info for %s', url)
            try:
                # perhaps process=False?
                return self.ytdl.extract_info(url, download=False)
            except:
                msg = 'youtube-dl failed to extract info'
                self.logger.exception(msg)
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write(b'500 Internal Server Error\n\n')
                self.wfile.write(msg.encode('utf-8'))
                self.wfile.write(b'\n')
                self.wfile.write(traceback.format_exc().encode('utf-8'))
                self.wfile.write(b'\n')
                raise

    def _json_info(self, url):
        try:
            info = self._extract_info(url)
        except:
            return
        info = json.dumps(info, separators=(',', ':'))
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(info.encode('utf-8'))
        self.wfile.write(b'\n')

    def _html_info(self, url):
        try:
            info = self._extract_info(url)
        except:
            return
        self.send_response(200)
        self.send_header('Content-Type', 'application/xhtml+xml')
        self.end_headers()
        generate_info(self.wfile, info)

    def do_GET(self):
        prefix = '/extract_info/'
        if self.path.startswith(prefix):
            url = self.path[len(prefix):]
            return self._html_info(url)

        _, _, path, _, query, _ = urllib.parse.urlparse(self.path)
        if path == '/':
            query = urllib.parse.parse_qs(query)
            if 'u' in query:
                return self._json_info(query['u'][0])

            self.send_response(400)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b"400 Bad Request\n\nmissing argument 'u'\n")
            return

        self.send_response(404)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'404 Not Found\n')

class HttpTcpServer(http.server.HTTPServer, socketserver.ThreadingMixIn):
    pass

def parse_address(addr):
    if addr.startswith('unix:'):
        class HttpUnixServer(HttpTcpServer, socketserver.UnixStreamServer):
            pass
        return (HttpUnixServer, addr[5:])

    addr = addr.rsplit(':', 1)
    if len(addr) == 1:
        addr.insert(0, '127.0.0.1')
    elif not addr[0]:
        addr[0] = '127.0.0.1'
    addr[1] = int(addr[1], 10)
    return (HttpTcpServer, tuple(addr))

def main():
    p = argparse.ArgumentParser(description="HTTP server that extracts information with youtube-dl")
    p.add_argument('--listen',  '-l', type=parse_address, default='127.0.0.1:8000',
                   help="listen address (default: 127.0.0.1:8000)")
    p.add_argument('--verbose', '-v', action='store_const',
                   default=logging.INFO, const=logging.DEBUG,
                   help="enable verbose logging")
    args = p.parse_args()

    logging.basicConfig(format='[%(asctime)s] %(levelname)-8s %(name)-18s %(message)s',
                        level=args.verbose, stream=sys.stderr)

    server_class, address = args.listen
    httpd = server_class(address, YtdlRequestHandler)
    httpd.ytdl_options = {
        'verbose':     True,
        'logtostderr': True,
        'color':       False,
    }
    logging.info('listening on %r...', address)
    httpd.serve_forever()
