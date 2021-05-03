import base64
import json

def _generate_stylesheet():
    yield '		<style><![CDATA[\n'
    with open('style.css', 'r', encoding='utf-8') as fp:
        yield from fp
    yield '		]]></style>\n'

def _generate_embed():
    with open('embed.xhtml', 'r', encoding='utf-8') as fp:
        for line in fp:
            if line == '		<link rel="icon" href="youtube-dl.svg"/>\n':
                pass
            elif line == '		<script src="embed.js" defer="yes"/>\n':
                yield '		<script defer="yes"><![CDATA[\n'
                with open('embed.js', 'r', encoding='utf-8') as script:
                    yield from script
                yield '		]]></script>'
            else:
                yield line

def _generate_script(info):
    yield '		<script defer="yes"><![CDATA[\n'
    with open('info.js', 'r', encoding='utf-8') as fp:
        for line in fp:
            if line.startswith('document.addEventListener("DOMContentLoaded",'):
                break
            elif line == '	let embedded_url = "embed.xhtml?";\n':
                yield  '	let embedded_url = "data:application/xhtml+xml;base64,'
                yield base64.b64encode(''.join(_generate_embed()).encode('utf-8')).decode('ascii')
                yield '?";\n'
            else:
                yield line
    yield 'document.addEventListener("DOMContentLoaded", _ => {\n'
    yield '	dump_info('
    yield json.dumps(info, separators=(',', ':'))
    yield r''', true);
});
		]]></script>
'''

def _generate_info(info):
    with open('info.xhtml', 'r', encoding='utf-8') as fp:
        for line in fp:
            if line == '		<link rel="icon" href="youtube-dl.svg"/>\n':
                pass
            elif line == '		<link rel="stylesheet" href="style.css"/>\n':
                yield from _generate_stylesheet()
            elif line == '		<script src="info.js" defer="yes"/>\n':
                yield from _generate_script(info)
            else:
                yield line

def generate_info(wfile, info):
    for x in _generate_info(info):
        wfile.write(x.encode('utf-8'))
