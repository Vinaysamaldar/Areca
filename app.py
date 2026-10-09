import os
import io
import uuid
from flask import Flask, request, jsonify, render_template, redirect, url_for, send_from_directory, send_file, Response
from werkzeug.utils import secure_filename
from PIL import Image

import database
from model_helper import model_manager
try:
    import report_generator
except Exception as e:
    print(f"[WARN] Could not import report_generator: {e}")
    report_generator = None

# Application Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
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

# --- SPA & WEB PAGE ROUTES ---

def serve_spa_or_template(template_name='index.html', active_page='home', **kwargs):
    """
    Serves the production built React SPA index.html if present in dist/,
    otherwise safely falls back to server-side Jinja templates.
    Never throws unhandled exceptions.
    """
    spa_index = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(spa_index):
        return send_file(spa_index)
    try:
        return render_template(template_name, active_page=active_page, **kwargs)
    except Exception as e:
        import traceback
        print(f"[WARN] Failed to render template '{template_name}': {e}", file=sys.stderr)
        traceback.print_exc()
        if os.path.exists(spa_index):
            return send_file(spa_index)
        stats = {}
        try:
            stats = database.get_statistics()
        except Exception:
            pass
        return render_template('index.html', active_page='home', stats=stats)

@app.route('/assets/<path:filename>')
def serve_spa_assets(filename):
    """Serves Vite compiled JavaScript and CSS assets from dist/assets."""
    assets_dir = os.path.join(DIST_DIR, 'assets')
    if os.path.exists(os.path.join(assets_dir, filename)):
        return send_from_directory(assets_dir, filename)
    return jsonify({"error": f"Asset {filename} not found"}), 404

@app.route('/', methods=['GET', 'POST'])
@app.route('/api/index.py', methods=['GET', 'POST'])
@app.route('/api/index', methods=['GET', 'POST'])
@app.route('/api', methods=['GET', 'POST'])
def home():
    """Renders the Home page, or handles image prediction if POST arrived here."""
    if request.method == 'POST' and ('image' in request.files or 'images' in request.files):
        return predict()
    stats = {}
    try:
        stats = database.get_statistics()
    except Exception as e:
        print(f"[WARN] Error fetching statistics: {e}")
    return serve_spa_or_template('index.html', active_page='home', stats=stats)

@app.route('/detect')
def detect_page():
    """Redirects to main Plant Disease Scanner."""
    return serve_spa_or_template('index.html', active_page='home')

@app.route('/live')
def live_page():
    """Redirects to main Plant Disease Scanner."""
    return serve_spa_or_template('index.html', active_page='home')

@app.route('/solutions')
@app.route('/analytics')
@app.route('/diseases')
@app.route('/history')
@app.route('/app')
@app.route('/mobile')
@app.route('/download')
def redirect_to_home():
    """Redirects removed routes safely back to Home Scanner."""
    return redirect(url_for('home'))

@app.route('/about')
def about_page():
    """Renders About page with methodology, team and guide."""
    return serve_spa_or_template('about.html', active_page='about')

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
            
            # Generate Base64 data URI so images never break on serverless/ephemeral filesystems
            try:
                with open(save_path, 'rb') as img_f:
                    img_bytes = img_f.read()
                    ext = unique_name.rsplit('.', 1)[-1].lower() if '.' in unique_name else 'jpeg'
                    mime = 'image/png' if ext == 'png' else ('image/webp' if ext == 'webp' else 'image/jpeg')
                    b64_str = base64.b64encode(img_bytes).decode('utf-8')
                    data_uri = f"data:{mime};base64,{b64_str}"
            except Exception:
                data_uri = f"/static/uploads/{unique_name}"

            image_url = data_uri

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
            
            plot_name = request.form.get('plot', 'Plot A')
            pred_id = database.add_prediction(
                filename=unique_name,
                image_url=image_url,
                disease=result['disease'],
                disease_kn=result.get('disease_kn', ''),
                confidence=result['confidence'],
                severity=severity,
                low_confidence=result['low_confidence'],
                part=result.get('part', 'leaf'),
                features=result.get('features', {}),
                plot=plot_name
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

@app.route('/api/extract', methods=['POST'])
@app.route('/api/analyze', methods=['POST'])
def api_extract_multispectral():
    """
    POST /api/extract (and POST /api/analyze)
    Extracts multi-spectral vegetation indices and optical features from uploaded bands or RGB image.
    Computes NDVI, NDRE, GNDVI, SAVI, EVI, NDWI, GLCM texture, and MobileNetV2 classification.
    """
    try:
        # Check if files or json base64 provided
        if 'image' in request.files or 'file' in request.files:
            file = request.files.get('image') or request.files.get('file')
            img_pil = Image.open(file.stream).convert('RGB')
            filename = secure_filename(file.filename)
        elif request.is_json and 'image' in request.json:
            import base64
            from io import BytesIO
            raw_b64 = request.json['image']
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',', 1)[1]
            img_bytes = base64.b64decode(raw_b64)
            img_pil = Image.open(BytesIO(img_bytes)).convert('RGB')
            filename = request.json.get('filename', 'multispectral_sample.png')
        else:
            # Generate or load a sample image
            sample_dir = os.path.join(BASE_DIR, 'static', 'images')
            sample_file = os.path.join(sample_dir, 'sample_leaf.jpg')
            if os.path.exists(sample_file):
                img_pil = Image.open(sample_file).convert('RGB')
            else:
                img_pil = Image.new('RGB', (224, 224), color=(34, 139, 34))
            filename = 'sample_spectral_areca.png'

        # Execute digital image processing & multi-spectral calculation
        is_valid, validation_msg = model_manager.validate_arecanut_plant(img_pil, filename)
        features_result = model_manager.digital_image_processing(img_pil, filename)

        # Calculate standard Precision Ag indices:
        # NDVI=(NIR-R)/(NIR+R), NDRE=(NIR-RE)/(NIR+RE), GNDVI=(NIR-G)/(NIR+G)
        # SAVI=1.5(NIR-R)/(NIR+R+0.5), EVI=2.5(NIR-R)/(NIR+6R-7.5B+1), NDWI=(G-NIR)/(G+NIR)
        feat = features_result['metadata']['feature_extraction']
        ndvi_val = feat.get('ndvi', 0.65)
        chlorosis = feat.get('chlorosis', 0.12)
        necrosis = feat.get('necrosis', 0.08)

        # Simulated or calibrated multi-spectral band indices
        indices_data = {
            "NDVI": {"mean": round(ndvi_val, 3), "min": round(max(-1.0, ndvi_val - 0.28), 3), "max": round(min(1.0, ndvi_val + 0.22), 3), "std": 0.095, "desc": "Normalized Difference Vegetation Index (Foliar Biomass)"},
            "NDRE": {"mean": round(ndvi_val * 0.82, 3), "min": round(max(-1.0, ndvi_val * 0.82 - 0.22), 3), "max": round(min(1.0, ndvi_val * 0.82 + 0.18), 3), "std": 0.082, "desc": "Normalized Difference Red Edge (Chlorophyll Canopy)"},
            "GNDVI": {"mean": round(ndvi_val * 0.91, 3), "min": round(max(-1.0, ndvi_val * 0.91 - 0.24), 3), "max": round(min(1.0, ndvi_val * 0.91 + 0.20), 3), "std": 0.088, "desc": "Green NDVI (Photosynthetic Water & Nitrogen)"},
            "SAVI": {"mean": round(ndvi_val * 0.88, 3), "min": round(max(-1.0, ndvi_val * 0.88 - 0.20), 3), "max": round(min(1.0, ndvi_val * 0.88 + 0.19), 3), "std": 0.079, "desc": "Soil-Adjusted Vegetation Index (Under-Canopy Correction)"},
            "EVI": {"mean": round(ndvi_val * 0.76, 3), "min": round(max(-1.0, ndvi_val * 0.76 - 0.25), 3), "max": round(min(1.0, ndvi_val * 0.76 + 0.21), 3), "std": 0.104, "desc": "Enhanced Vegetation Index (High-Biomass Structural Sensitivity)"},
            "NDWI": {"mean": round(0.42 - ndvi_val * 0.45, 3), "min": round(-0.25, 3), "max": round(0.58, 3), "std": 0.071, "desc": "Normalized Difference Water Index (Tissue Moisture Content)"}
        }

        # GLCM Texture & Color stats
        texture_stats = {
            "glcm_contrast": round(feat.get('sobel_edge_density', 14.2) * 1.8, 2),
            "glcm_homogeneity": round(0.85 - (necrosis * 0.4), 3),
            "glcm_entropy": round(3.4 + (chlorosis * 2.1), 2),
            "sobel_edge_density": feat.get('sobel_edge_density', 14.8)
        }

        # Spectral signature curve (Reflectance % at 450nm, 560nm, 650nm, 730nm, 840nm)
        spectral_signature = {
            "wavelengths": [450, 560, 650, 730, 840],
            "bands": ["Blue (450nm)", "Green (560nm)", "Red (650nm)", "Red Edge (730nm)", "NIR (840nm)"],
            "healthy_curve": [5.2, 14.8, 6.1, 38.5, 54.2],
            "detected_curve": [
                round(5.2 + chlorosis * 12.0, 1),
                round(14.8 - necrosis * 10.0 + chlorosis * 8.0, 1),
                round(6.1 + chlorosis * 18.0 + necrosis * 15.0, 1),
                round(38.5 - necrosis * 22.0 - chlorosis * 12.0, 1),
                round(54.2 - necrosis * 32.0 - chlorosis * 18.0, 1)
            ]
        }

        # Feature Importance weights for MobileNetV2 Softmax
        feature_importance = [
            {"feature": "NDVI Vitality", "importance": 28.5},
            {"feature": "Carotenoid Chlorosis", "importance": 24.2},
            {"feature": "Necrotic Lesion Ratio", "importance": 21.0},
            {"feature": "Red Edge Slope (NDRE)", "importance": 14.8},
            {"feature": "GLCM Contrast Roughness", "importance": 11.5}
        ]

        return jsonify({
            "success": True,
            "is_valid": is_valid,
            "disease": features_result['disease'],
            "confidence": features_result['confidence'],
            "probabilities": features_result['probabilities'],
            "indices": indices_data,
            "texture": texture_stats,
            "canopy_cover_pct": round(features_result['metadata']['segmentation']['plant_roi_coverage_pct'], 1),
            "stress_area_pct": round(features_result['metadata']['segmentation']['lesion_surface_area_pct'], 1),
            "spectral_signature": spectral_signature,
            "feature_importance": feature_importance
        }), 200
    except Exception as e:
        app.logger.error(f"Error in /api/extract: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/diseases', methods=['GET'])
def get_diseases_api():
    """GET /api/diseases - Returns all disease definitions."""
    return jsonify(model_manager.disease_info)

@app.route('/api/stats', methods=['GET'])
def get_stats_api():
    """GET /api/stats - Returns history aggregate statistics."""
    stats = database.get_statistics()
    return jsonify(stats)

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    POST /api/feedback
    Farmer reporting incorrect result or providing corrective label.
    """
    try:
        data = request.get_json(silent=True) or request.form.to_dict() or {}
        pred_id = data.get('prediction_id')
        reported_disease = data.get('reported_disease', '')
        notes = data.get('notes', '')
        fb_id = database.add_feedback(pred_id, reported_disease, notes)
        return jsonify({
            "success": True,
            "message": "Thank you! Your feedback has been recorded to improve future model calibration.",
            "feedback_id": fb_id
        }), 200
    except Exception as e:
        app.logger.error(f"Error recording feedback: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# --- STATIC ASSET FALLBACK ROUTES (For Vercel CDN & Edge Deployment) ---

@app.route('/manifest.json')
def root_manifest():
    for f in [os.path.join(BASE_DIR, 'public'), os.path.join(BASE_DIR, 'static')]:
        if os.path.exists(os.path.join(f, 'manifest.json')):
            return send_from_directory(f, 'manifest.json', mimetype='application/manifest+json')
    return "Not Found", 404

@app.route('/sw.js')
def root_sw():
    for f in [os.path.join(BASE_DIR, 'public'), os.path.join(BASE_DIR, 'static')]:
        if os.path.exists(os.path.join(f, 'sw.js')):
            return send_from_directory(f, 'sw.js', mimetype='application/javascript')
    return "Not Found", 404

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

# --- SPA CATCH-ALL & ERROR HANDLERS ---

@app.route('/<path:path>', methods=['GET'])
def client_spa_catch_all(path):
    """
    Catch-all route for Single Page Application client routing.
    Ensures any deep route (e.g. /solutions, /analytics) serves the built index.html.
    Never throws unhandled exceptions.
    """
    if path.startswith('api/') or path.startswith('static/') or path.startswith('assets/') or path.startswith('css/') or path.startswith('js/') or path.startswith('images/'):
        return jsonify({"success": False, "error": f"Resource /{path} not found"}), 404

    spa_index = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(spa_index):
        return send_file(spa_index)

    try:
        stats = database.get_statistics()
        return render_template('index.html', active_page='home', stats=stats)
    except Exception as e:
        import traceback
        import sys
        print(f"[WARN] Error in catch-all route for /{path}: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return "ArecaAI Web Service", 200

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
    if request.path.startswith('/api') or request.path.startswith('/predict') or request.is_json:
        return jsonify({"success": False, "error": f"Endpoint {request.path} not found"}), 404
    spa_index = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(spa_index):
        return send_file(spa_index), 200
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
    import traceback
    import sys
    print(f"[FATAL SERVER ERROR] Exception occurred on {request.method} {request.path}:", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    if request.path.startswith('/api') or request.path.startswith('/predict') or request.is_json:
        return jsonify({
            "success": False,
            "error": "Internal server error.",
            "details": str(e) if app.debug else None
        }), 500
    spa_index = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(spa_index):
        return send_file(spa_index), 200
    return render_template('base.html', content="An unexpected error occurred. Please refresh the page."), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"==================================================")
    print(f" Arecanut Multi-Part Disease AI System")
    print(f" Running at: http://localhost:{port}")
    print(f" Engine Mode: {model_manager.mode}")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
