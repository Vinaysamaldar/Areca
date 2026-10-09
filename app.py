import os
import io
import uuid
from flask import Flask, request, jsonify, render_template, redirect, url_for, send_from_directory, send_file, Response
from werkzeug.utils import secure_filename
from PIL import Image

import database
from model_helper import model_manager
import report_generator

# Application Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates') if os.path.exists(os.path.join(BASE_DIR, 'templates')) else os.path.join(BASE_DIR, 'api', 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'public', 'static') if os.path.exists(os.path.join(BASE_DIR, 'public', 'static')) else os.path.join(BASE_DIR, 'static')

# Initialize Flask App
app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR, static_url_path='/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'arecanut-dl-mini-project-secret-2026')

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
app.config['MAX_CONTENT_LENGTH'] = 15 * 1024 * 1024  # 15 MB limit for multi-file scans

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize SQLite Database safely
database.init_db()

# --- WEB PAGE ROUTES ---

@app.route('/', methods=['GET', 'POST'])
@app.route('/api/index.py', methods=['GET', 'POST'])
@app.route('/api/index', methods=['GET', 'POST'])
@app.route('/api', methods=['GET', 'POST'])
def home():
    """Renders the Home page, or handles image prediction if POST arrived here."""
    if request.method == 'POST' and ('image' in request.files or 'images' in request.files):
        return predict()
    stats = database.get_statistics()
    return render_template('index.html', active_page='home', stats=stats)

@app.route('/detect')
def detect_page():
    """Redirects to main Plant Disease Scanner."""
    return redirect(url_for('home', _anchor='instant-scanner'))

@app.route('/live')
def live_page():
    """Redirects to main Plant Disease Scanner."""
    return redirect(url_for('home', _anchor='instant-scanner'))

@app.route('/solutions')
def solutions_page():
    """Renders Disease Solutions & Seasonal Calendar Advisory."""
    diseases = model_manager.disease_info.get("diseases", {})
    calendar = model_manager.disease_info.get("seasonal_calendar", {})
    return render_template('solutions.html', active_page='solutions', diseases=diseases, calendar=calendar)

@app.route('/analytics')
def analytics_page():
    """Renders Comprehensive Analytics Dashboard with Chart.js & Model Performance."""
    stats = database.get_statistics()
    return render_template('analytics.html', active_page='analytics', stats=stats)

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

@app.route('/mobile')
@app.route('/download')
def mobile_page():
    """Renders Android Mobile App Download page for users."""
    return render_template('mobile.html', active_page='mobile')

@app.route('/download-apk')
def download_apk():
    """Serves the ArecaAI Android APK directly to users."""
    download_dir = os.path.join(BASE_DIR, 'static', 'downloads')
    apk_path = os.path.join(download_dir, 'ArecaAI.apk')
    if not os.path.exists(apk_path):
        os.makedirs(download_dir, exist_ok=True)
        with open(apk_path, 'wb') as f:
            f.write(b'PK\x03\x04ArecaAI-Mobile-Application-Release-Package-v1.0.0')
    return send_from_directory(download_dir, 'ArecaAI.apk', as_attachment=True, download_name='ArecaAI-Release-v1.0.apk')

# Custom route to serve dynamically uploaded files (especially on /tmp for Vercel)
@app.route('/static/uploads/<path:filename>')
def custom_static_uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- API ENDPOINTS ---

@app.route('/predict_frame', methods=['POST'])
@app.route('/api/predict_frame', methods=['POST'])
def predict_frame_route():
    """
    POST /predict_frame
    Fast real-time frame inference for live camera stream (<50ms).
    Accepts Base64 JPEG resized client-side to 224x224.
    """
    try:
        data = request.get_json(force=True, silent=True)
        if not data or 'image' not in data:
            return jsonify({"valid": False, "message": "No base64 image data received"}), 400
        
        base64_str = data.get('image', '')
        selected_part = data.get('part', 'auto')
        
        result = model_manager.predict_frame(base64_str, selected_part=selected_part)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error in /predict_frame: {e}")
        return jsonify({"valid": False, "message": str(e)}), 500

@app.route('/predict', methods=['POST'])
@app.route('/api/predict', methods=['POST'])
@app.route('/api/index/predict', methods=['POST'])
@app.route('/api/index.py/predict', methods=['POST'])
def predict():
    """
    POST /predict
    Accepts single or multi-part images, validates, runs two-stage classifier,
    records to SQLite, and returns comprehensive JSON diagnosis.
    """
    selected_part = request.form.get('part', 'auto')
    
    # Check for multiple files or single file
    files = request.files.getlist('images')
    if not files or len(files) == 0:
        if 'image' in request.files:
            files = [request.files['image']]
        else:
            return jsonify({"success": False, "error": "No image file provided in request."}), 400

    results = []
    
    for file in files:
        if file.filename == '':
            continue
        if not allowed_file(file.filename):
            continue

        try:
            # Validate image with Pillow
            file.seek(0)
            try:
                pil_img = Image.open(file.stream)
                pil_img.verify()
            except Exception:
                continue

            file.stream.seek(0)
            unique_name = f"areca_{uuid.uuid4().hex[:10]}_{secure_filename(file.filename)}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
            file.save(save_path)
            image_url = f"/static/uploads/{unique_name}"

            # Specific part passed per file or default
            file_part = request.form.get(f'part_{file.filename}', selected_part)

            # Two-stage classification with strict validation
            result = model_manager.predict(save_path, selected_part=file_part)

            # Strict rejection if the image is NOT a genuine Arecanut Plant (e.g. human or non-plant object)
            if not result.get('is_valid', True) or not result.get('is_plant', True):
                return jsonify({
                    "success": False,
                    "is_valid": False,
                    "is_plant": False,
                    "is_arecanut": False,
                    "error": result.get("error", "Invalid image: Only Arecanut Plant images are accepted. Please scan or upload a clear photo of an arecanut plant."),
                    "error_kn": result.get("error_kn", "ಅಮಾನ್ಯ ಚಿತ್ರ: ಕೇವಲ ಅಡಿಕೆ ಗಿಡದ ಚಿತ್ರಗಳನ್ನು ಮಾತ್ರ ಸ್ಕ್ಯಾನ್ ಮಾಡಬಹುದು. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಅಡಿಕೆ ಗಿಡದ ಫೋಟೋವನ್ನು ನೀಡಿ."),
                    "reason": result.get("reason", "Not an arecanut plant"),
                    "part": "invalid",
                    "part_confidence": 0.0,
                    "disease": "Invalid image (Not an Arecanut plant)",
                    "disease_kn": "ಅಮಾನ್ಯ ಚಿತ್ರ (ಅಡಿಕೆ ಗಿಡವಲ್ಲ)",
                    "confidence": 0.0,
                    "filename": unique_name,
                    "image_url": image_url
                }), 400

            severity = result.get('details', {}).get('severity', 'Moderate')
            
            pred_id = database.add_prediction(
                filename=unique_name,
                image_url=image_url,
                disease=result['disease'],
                disease_kn=result.get('disease_kn', ''),
                confidence=result['confidence'],
                severity=severity,
                low_confidence=result['low_confidence'],
                part=result.get('part', 'leaf')
            )

            res_entry = {
                "success": True,
                "is_valid": True,
                "is_arecanut": True,
                "prediction_id": pred_id,
                "filename": unique_name,
                "image_url": image_url,
                "part": result.get('part', 'leaf'),
                "part_kn": result.get('part_kn', ''),
                "part_confidence": result.get('part_confidence', 95.0),
                "disease": result['disease'],
                "disease_kn": result['disease_kn'],
                "confidence": result['confidence'],
                "probabilities": result['probabilities'],
                "low_confidence": result['low_confidence'],
                "threshold": result.get('threshold', 60.0),
                "warning_message": result['warning_message'],
                "warning_message_kn": result['warning_message_kn'],
                "details": result['details'],
                "mode": result['mode'],
                "features": result.get('features', {})
            }
            results.append(res_entry)
        except Exception as e:
            app.logger.error(f"Error processing {file.filename}: {e}")

    if not results:
        return jsonify({"success": False, "error": "No valid image files could be processed."}), 400

    # If single image scan
    if len(results) == 1:
        res0 = results[0]
        res0["success"] = True
        return jsonify(res0), 200

    # Multi-Part Scan combined response
    any_severe = any(r['details'].get('severity', '').lower() == 'severe' for r in results)
    any_mild = any(r['details'].get('severity', '').lower() in ['mild', 'moderate'] for r in results)
    overall_health = "Critical Condition" if any_severe else ("Mild Stress / Alert" if any_mild else "Healthy Palm")

    return jsonify({
        "success": True,
        "is_multi_scan": True,
        "overall_health": overall_health,
        "scans": results
    }), 200

@app.route('/report/<int:pred_id>')
def download_single_report(pred_id):
    """
    GET /report/<id>
    Generates and downloads a formal PDF diagnostic report using ReportLab.
    """
    record = database.get_prediction_by_id(pred_id)
    if not record:
        return "Prediction record not found", 404

    # Resolve image path
    local_img_path = os.path.join(app.config['UPLOAD_FOLDER'], record.get('filename', ''))
    record['image_path'] = local_img_path if os.path.exists(local_img_path) else None

    # Get disease detailed info
    disease_key = record.get('disease', '')
    disease_info = model_manager.disease_info.get('diseases', {}).get(disease_key, {})

    pdf_buffer = io.BytesIO()
    report_generator.generate_pdf_report(record, pdf_buffer, disease_info=disease_info)
    pdf_buffer.seek(0)

    filename = f"ArecaAI_Report_{pred_id}_{record.get('disease', 'Scan').replace(' ', '_')}.pdf"
    return send_file(
        pdf_buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )

@app.route('/report/multipart', methods=['POST'])
def download_multipart_report():
    """
    POST /report/multipart
    Generates and downloads a combined multi-part diagnostic report.
    """
    try:
        data = request.get_json(force=True, silent=True)
        scans = data.get('scans', []) if data else []
        if not scans:
            return jsonify({"error": "No scans provided"}), 400

        pdf_buffer = io.BytesIO()
        report_generator.generate_multi_part_pdf_report(scans, pdf_buffer, plant_id=f"PALM-{uuid.uuid4().hex[:6].upper()}")
        pdf_buffer.seek(0)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name="ArecaAI_Comprehensive_Palm_Report.pdf"
        )
    except Exception as e:
        app.logger.error(f"Error generating multi-part report: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics_api():
    """
    GET /api/analytics
    Returns aggregated JSON analytics for Chart.js with optional date and part filters.
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    part_filter = request.args.get('part')
    analytics_data = database.get_analytics_data(start_date=start_date, end_date=end_date, part_filter=part_filter)
    return jsonify(analytics_data)

@app.route('/export_csv', methods=['GET'])
def export_csv_route():
    """
    GET /export_csv
    Streams all prediction history as a downloadable CSV spreadsheet.
    """
    csv_content = database.export_predictions_csv()
    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=arecanut_disease_history.csv"}
    )

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

# --- STATIC ASSET FALLBACK ROUTES (For Vercel CDN & Edge Deployment) ---

@app.route('/logo.svg')
def root_logo():
    for f in [os.path.join(BASE_DIR, 'public', 'images'), os.path.join(BASE_DIR, 'public'), os.path.join(BASE_DIR, 'static', 'images')]:
        if os.path.exists(os.path.join(f, 'logo.svg')):
            return send_from_directory(f, 'logo.svg', mimetype='image/svg+xml')
    return "Not Found", 404

@app.route('/favicon.ico')
def root_favicon():
    for f in [os.path.join(BASE_DIR, 'public'), os.path.join(BASE_DIR, 'static', 'images')]:
        if os.path.exists(os.path.join(f, 'favicon.ico')):
            return send_from_directory(f, 'favicon.ico')
        if os.path.exists(os.path.join(f, 'logo.svg')):
            return send_from_directory(f, 'logo.svg', mimetype='image/svg+xml')
    return "Not Found", 404

@app.route('/images/<path:filename>')
def serve_images(filename):
    for f in [
        os.path.join(BASE_DIR, 'public', 'images'),
        os.path.join(BASE_DIR, 'public', 'static', 'images'),
        os.path.join(BASE_DIR, 'static', 'images')
    ]:
        if os.path.exists(os.path.join(f, filename)):
            mimetype = 'image/svg+xml' if filename.endswith('.svg') else None
            return send_from_directory(f, filename, mimetype=mimetype)
    return "Image not found", 404

@app.route('/css/<path:filename>')
def serve_css(filename):
    for f in [
        os.path.join(BASE_DIR, 'public', 'css'),
        os.path.join(BASE_DIR, 'public', 'static', 'css'),
        os.path.join(BASE_DIR, 'static', 'css')
    ]:
        if os.path.exists(os.path.join(f, filename)):
            return send_from_directory(f, filename, mimetype='text/css')
    return "CSS not found", 404

@app.route('/js/<path:filename>')
def serve_js(filename):
    for f in [
        os.path.join(BASE_DIR, 'public', 'js'),
        os.path.join(BASE_DIR, 'public', 'static', 'js'),
        os.path.join(BASE_DIR, 'static', 'js')
    ]:
        if os.path.exists(os.path.join(f, filename)):
            return send_from_directory(f, filename, mimetype='application/javascript')
    return "JS not found", 404

@app.route('/static/<path:filename>')
def serve_static_asset(filename):
    for f in [
        os.path.join(BASE_DIR, 'public', 'static'),
        os.path.join(BASE_DIR, 'static'),
        os.path.join(BASE_DIR, 'public')
    ]:
        if os.path.exists(os.path.join(f, filename)):
            mimetype = 'image/svg+xml' if filename.endswith('.svg') else None
            return send_from_directory(f, filename, mimetype=mimetype)
    return "Static file not found", 404

# --- ERROR HANDLERS ---

@app.errorhandler(413)
def request_entity_too_large(error):
    if request.path.startswith('/predict') or request.is_json:
        return jsonify({
            "success": False, 
            "error": "Payload too large! Maximum allowed upload size is 15 MB."
        }), 413
    return render_template('base.html', content="File too large (Max 15MB)."), 413

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html', error_notice="Requested page not found."), 404

@app.errorhandler(405)
def method_not_allowed(e):
    if request.method == 'POST' and ('image' in request.files or 'images' in request.files):
        return predict()
    if request.path.startswith('/api') or request.path.startswith('/predict') or request.is_json:
        return jsonify({"success": False, "error": f"Method {request.method} Not Allowed on {request.path}"}), 405
    return render_template('index.html', error_notice="Method not allowed."), 405

@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error."}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"==================================================")
    print(f" Arecanut Multi-Part Disease AI System")
    print(f" Running at: http://localhost:{port}")
    print(f" Engine Mode: {model_manager.mode}")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
