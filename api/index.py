import sys
import os
import traceback

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)

for path in [root_dir, current_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

class VercelPathFixMiddleware:
    """
    Handles Vercel internal rewrites.
    Restores the real incoming PATH_INFO from either __path query parameter
    or Vercel proxy headers so Flask routes match accurately.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        from urllib.parse import parse_qs, urlencode

        query_string = environ.get('QUERY_STRING', '')
        # 1. Check if rewritten via __path query parameter
        if '__path' in query_string:
            params = parse_qs(query_string, keep_blank_values=True)
            if '__path' in params and params['__path'][0]:
                req_path = params.pop('__path')[0]
                if not req_path.startswith('/'):
                    req_path = '/' + req_path
                environ['PATH_INFO'] = req_path
                environ['QUERY_STRING'] = urlencode(params, doseq=True)
            else:
                params.pop('__path', None)
                environ['PATH_INFO'] = '/'
                environ['QUERY_STRING'] = urlencode(params, doseq=True)
        else:
            path_info = environ.get('PATH_INFO', '')
            if path_info in ('/api/index.py', '/api/index', '/api', ''):
                # 2. Check proxy headers
                original_path = None
                for header in [
                    'HTTP_X_FORWARDED_URI',
                    'HTTP_X_VERCEL_FORWARDED_URI',
                    'HTTP_X_ORIGINAL_URL',
                    'HTTP_X_REWRITE_URL',
                    'REQUEST_URI',
                    'RAW_URI',
                ]:
                    val = environ.get(header)
                    if val and val not in ('/api/index.py', '/api/index', '/api'):
                        original_path = val
                        break

                if original_path:
                    if '?' in original_path:
                        original_path = original_path.split('?', 1)[0]
                    environ['PATH_INFO'] = original_path
                else:
                    environ['PATH_INFO'] = '/'

        return self.wsgi_app(environ, start_response)

try:
    from app import app
    app.wsgi_app = VercelPathFixMiddleware(app.wsgi_app)
except Exception as e:
    from flask import Flask
    app = Flask(__name__)
    err_msg = traceback.format_exc()
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def error_handler(path):
        return f"""
        <html>
        <head><title>ArecaAI Startup Diagnostics</title></head>
        <body style="font-family:sans-serif;padding:30px;background:#fef2f2;color:#991b1b;">
            <h2>ArecaAI Serverless Initialization Error</h2>
            <p>An exception occurred while starting the Flask application on Vercel:</p>
            <pre style="background:#fff;border:1px solid #f87171;padding:15px;border-radius:8px;overflow:auto;">{err_msg}</pre>
        </body>
        </html>
        """, 500
