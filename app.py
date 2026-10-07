import os
import uuid
from flask import Flask, request, jsonify, render_template, redirect, url_for, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image

import database
from model_helper import model_manager

# Initialize Flask App
app = Flask(__name__)

# Application Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'arecanut-dl-mini-project-secret-2026')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Vercel and serverless functions only have write permissions in /tmp
if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    UPLOAD_FOLDER = '/tmp/uploads'
else:
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')

try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except Exception as e:
    print(f"[WARN] Could not create uploads folder: {e}")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 Megabytes limit

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize SQLite Database safely
database.init_db()

# --- WEB PAGE ROUTES ---

@app.route('/')
def home():
    """Renders the Home page."""
    stats = database.get_statistics()
    return render_template('index.html', active_page='home', stats=stats)

@app.route('/detect')
def detect_page():
    """Renders the Detect / Upload page."""
    return render_template('detect.html', active_page='detect')

@app.route('/diseases')
def diseases_page():
    """Renders Disease Information & Advisory catalog."""
    diseases = model_manager.disease_info.get("diseases", {})
    return render_template('diseases.html', active_page='diseases', diseases=diseases)

@app.route('/history')
def history_page():
    """Renders the History log page."""
    predictions = database.get_all_predictions()
    stats = database.get_statistics()
    return render_template('history.html', active_page='history', predictions=predictions, stats=stats)

@app.route('/about')
def about_page():
    """Renders About page with methodology, team and guide."""
    return render_template('about.html', active_page='about')

# Custom route to serve dynamically uploaded files (especially on /tmp for Vercel)
@app.route('/static/uploads/<path:filename>')
def custom_static_uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- API ENDPOINTS ---

@app.route('/predict', methods=['POST'])
def predict():
    """
    POST /predict
    Accepts multipart image file, validates, runs deep learning model, logs to database,
    and returns comprehensive JSON diagnosis.
    """
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided in request."}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"success": False, "error": "No image file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False, 
            "error": "Invalid file format. Only JPG, JPEG, PNG, and WEBP formats up to 5 MB are allowed."
        }), 400

    try:
        # Validate that the file is indeed a valid image using Pillow
        file.seek(0)
        try:
            pil_img = Image.open(file.stream)
            pil_img.verify()
        except Exception:
            return jsonify({"success": False, "error": "Corrupted or unreadable image file."}), 400

        # Reset stream pointer after verify()
        file.stream.seek(0)

        # Generate unique secure filename
        original_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_name = f"areca_{uuid.uuid4().hex[:10]}_{secure_filename(file.filename)}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
        
        # Save file to disk
        file.save(save_path)
        image_url = f"/static/uploads/{unique_name}"

        # Run inference through ModelManager
        result = model_manager.predict(save_path)

        # Record prediction into SQLite
        severity = result.get('details', {}).get('severity', 'Moderate')
        pred_id = database.add_prediction(
            filename=unique_name,
            image_url=image_url,
            disease=result['disease'],
            disease_kn=result.get('disease_kn', ''),
            confidence=result['confidence'],
            severity=severity,
            low_confidence=result['low_confidence']
        )

        response_payload = {
            "success": True,
            "prediction_id": pred_id,
            "filename": unique_name,
            "image_url": image_url,
            "disease": result['disease'],
            "disease_kn": result['disease_kn'],
            "confidence": result['confidence'],
            "probabilities": result['probabilities'],
            "low_confidence": result['low_confidence'],
            "threshold": result['threshold'],
            "warning_message": result['warning_message'],
            "warning_message_kn": result['warning_message_kn'],
            "details": result['details'],
            "mode": result['mode']
        }

        return jsonify(response_payload), 200

    except Exception as e:
        app.logger.error(f"Error during prediction: {e}")
        return jsonify({"success": False, "error": f"Internal prediction failure: {str(e)}"}), 500

@app.route('/api/history', methods=['GET'])
def get_history_api():
    """GET /api/history - Returns JSON history list."""
    records = database.get_all_predictions()
    return jsonify({"success": True, "count": len(records), "data": records})

@app.route('/api/history/<int:pred_id>', methods=['DELETE'])
def delete_history_api(pred_id):
    """DELETE /api/history/<id> - Deletes record and file."""
    record = database.get_prediction_by_id(pred_id)
    if not record:
        return jsonify({"success": False, "error": "Record not found"}), 404

    # Remove file if exists
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], record['filename'])
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        app.logger.warning(f"Could not remove file {record['filename']}: {e}")

    success = database.delete_prediction(pred_id)
    return jsonify({"success": success})

@app.route('/api/history/clear', methods=['POST'])
def clear_history_api():
    """POST /api/history/clear - Clears all prediction records."""
    database.clear_all_predictions()
    return jsonify({"success": True, "message": "All history records cleared."})

@app.route('/api/diseases', methods=['GET'])
def get_diseases_api():
    """GET /api/diseases - Returns all disease definitions."""
    return jsonify(model_manager.disease_info)

@app.route('/api/stats', methods=['GET'])
def get_stats_api():
    """GET /api/stats - Returns history aggregate statistics."""
    stats = database.get_statistics()
    return jsonify(stats)

# --- ERROR HANDLERS ---

@app.errorhandler(413)
def request_entity_too_large(error):
    if request.path == '/predict':
        return jsonify({
            "success": False, 
            "error": "Image file too large! Maximum allowed size is 5 MB."
        }), 413
    return render_template('base.html', content="File too large (Max 5MB)."), 413

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html', error_notice="Requested page not found."), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error."}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"==================================================")
    print(f" Arecanut Disease Detection AI System")
    print(f" Running at: http://localhost:{port}")
    print(f" Engine Mode: {model_manager.mode}")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
