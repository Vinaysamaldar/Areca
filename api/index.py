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
    When Vercel rewrites requests to /api/index, this middleware inspects
    Vercel's original path headers (x-forwarded-uri, x-original-url, etc.)
    and restores the real incoming PATH_INFO so Flask routes match accurately.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path_info = environ.get('PATH_INFO', '')
        if path_info in ('/api/index.py', '/api/index', '/api'):
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
                matched = environ.get('HTTP_X_MATCHED_PATH') or environ.get('HTTP_X_VERCEL_MATCHED_PATH')
                if matched and matched not in ('/api/index.py', '/api/index', '/api'):
                    if '?' in matched:
                        matched = matched.split('?', 1)[0]
                    environ['PATH_INFO'] = matched
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
