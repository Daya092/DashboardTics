#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import json
from urllib.parse import urlparse

API_URL = "https://solid-potato-4j75rxjjwrgxhqqr4-3000.app.github.dev/api/lecturas"

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/lecturas":
            try:
                with urllib.request.urlopen(API_URL) as response:
                    data = response.read().decode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data.encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'Error proxying API')
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", 3001), ProxyHandler) as httpd:
        print("Proxy server running on port 3001")
        httpd.serve_forever()