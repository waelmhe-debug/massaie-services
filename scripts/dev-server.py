#!/usr/bin/env python3
"""
SPA-aware HTTP server for Massaie Services dev.
Serves static files normally; falls back to index.html for unknown paths
so the client-side router handles /articles/* and other SPA routes.
"""
import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 5173))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        # Strip query string for file lookup
        path = self.path.split('?')[0].split('#')[0]

        # Vite maps public/ to root — rewrite /content/* and /admin/* to /public/*
        if path.startswith('/content') or path.startswith('/admin') or path.startswith('/images'):
            self.path = '/public' + self.path
            return super().do_GET()

        # Static assets (js, css, fonts, etc.) — serve normally
        if '.' in os.path.basename(path):
            return super().do_GET()

        # Everything else: serve index.html (SPA fallback)
        self.path = '/index.html'
        return super().do_GET()

    def end_headers(self):
        # Disable caching for JS and CSS so edits show immediately
        path = self.path.split('?')[0]
        if path.endswith(('.js', '.css')):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Suppress noisy output; only print errors
        code = args[1] if len(args) > 1 else ''
        if str(code).startswith(('4', '5')):
            super().log_message(fmt, *args)

with socketserver.TCPServer(('', PORT), SPAHandler) as httpd:
    httpd.allow_reuse_address = True
    print(f'Massaie dev server running at http://localhost:{PORT}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
