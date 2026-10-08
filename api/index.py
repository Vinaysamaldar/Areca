import sys
import os
import traceback

# Append project root directory to Python module search path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)

for path in [root_dir, current_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app import app
    # Export Flask instance for Vercel WSGI
    app = app
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
