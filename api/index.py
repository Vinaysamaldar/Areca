import sys
import os

# Append project root directory to Python module search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel WSGI entry point
# Exports the Flask application instance
app = app
