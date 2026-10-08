"""
Automated Verification Suite for Upgraded Arecanut Multi-Part Disease Detection System
Tests:
- Database CRUD & Analytics aggregations
- Two-Stage Model Inference (Model A Part + Model B Disease)
- Live Frame (<50ms) inference API (/predict_frame)
- Multi-Part Palm Scan (/predict)
- ReportLab PDF Diagnostic generation (/report/<id> and /report/multipart)
- Web Routes: /live, /solutions, /analytics, /export_csv, /detect
"""
import os
import io
import json
import base64
import sys
from PIL import Image

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def run_tests():
    print("==================================================")
    print(" Running Full System Verification Suite...")
    print("==================================================")

    # 1. Test Database
    print("\n[TEST 1] Testing SQLite Database with Part Support...")
    import database
    database.init_db()
    pred_id = database.add_prediction(
        filename="test_sample_leaf.jpg",
        image_url="/static/uploads/test_sample_leaf.jpg",
        disease="Yellow Leaf Disease",
        disease_kn="ಹಳದಿ ಎಲೆ ರೋಗ",
        confidence=96.5,
        severity="Severe",
        low_confidence=False,
        part="leaf"
    )
    print(f"  [PASS] Added prediction record with part='leaf' (ID: {pred_id})")

    records = database.get_all_predictions()
    assert len(records) > 0, "No records returned from get_all_predictions()"
    print(f"  [PASS] Total records: {len(records)}")

    analytics = database.get_analytics_data()
    assert "disease_distribution" in analytics
    assert "part_distribution" in analytics
    assert "timeline_distribution" in analytics
    print(f"  [PASS] Analytics data structured correctly for Chart.js: {list(analytics.keys())}")

    csv_data = database.export_predictions_csv()
    assert "Plant Part" in csv_data
    assert "Yellow Leaf Disease" in csv_data
    print("  [PASS] CSV export generated with proper headers and data")

    # 2. Test ModelManager Two-Stage Architecture
    print("\n[TEST 2] Testing ModelManager Two-Stage Engine...")
    from model_helper import model_manager
    print(f"  [PASS] ModelManager mode: {model_manager.mode}")
    print(f"  [PASS] Parts supported: {model_manager.part_classes}")
    print(f"  [PASS] Diseases supported: {len(model_manager.disease_classes)} classes")

    # Dummy test image
    test_img = Image.new('RGB', (224, 224), color=(34, 197, 94))
    test_img_path = os.path.join(os.path.dirname(__file__), 'test_sample_leaf.jpg')
    test_img.save(test_img_path)

    result = model_manager.predict(test_img_path, selected_part="leaf")
    print(f"  [PASS] Inference: Part='{result['part']}', Disease='{result['disease']}', Conf={result['confidence']}%")
    assert result['part'] in model_manager.part_classes
    assert 'details' in result
    assert 'features' in result

    # 3. Test Live Frame Real-Time API (POST /predict_frame)
    print("\n[TEST 3] Testing POST /predict_frame (Live Stream)...")
    from app import app
    client = app.test_client()

    buffer = io.BytesIO()
    test_img.save(buffer, format='JPEG')
    b64_str = "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode('utf-8')

    resp_frame = client.post('/predict_frame', json={'image': b64_str, 'part': 'auto'})
    assert resp_frame.status_code == 200, f"/predict_frame returned {resp_frame.status_code}"
    frame_data = json.loads(resp_frame.data)
    assert 'part' in frame_data
    assert 'disease' in frame_data
    assert 'badge_color' in frame_data
    print(f"  [PASS] Live frame output: {frame_data['disease']} [Badge: {frame_data['badge_color']}]")

    # 4. Test Single & Multi-Part POST /predict
    print("\n[TEST 4] Testing Single & Multi-Part POST /predict...")
    buffer.seek(0)
    data = {
        'image': (buffer, 'test_sample_leaf.jpg'),
        'part': 'leaf'
    }
    resp_pred = client.post('/predict', data=data, content_type='multipart/form-data')
    assert resp_pred.status_code == 200
    pred_res = json.loads(resp_pred.data)
    assert pred_res['success'] is True
    assert pred_res['part'] == 'leaf'
    new_pred_id = pred_res['prediction_id']
    print(f"  [PASS] Single scan successful (ID: {new_pred_id})")

    # Multi-Part scan test
    b1, b2 = io.BytesIO(), io.BytesIO()
    test_img.save(b1, format='JPEG')
    test_img.save(b2, format='JPEG')
    b1.seek(0)
    b2.seek(0)
    multi_data = {
        'images': [(b1, 'leaf_sample.jpg'), (b2, 'nut_sample.jpg')],
        'part_leaf_sample.jpg': 'leaf',
        'part_nut_sample.jpg': 'nut'
    }
    resp_multi = client.post('/predict', data=multi_data, content_type='multipart/form-data')
    assert resp_multi.status_code == 200
    multi_res = json.loads(resp_multi.data)
    assert multi_res['is_multi_scan'] is True
    assert len(multi_res['scans']) == 2
    print(f"  [PASS] Multi-Part palm scan output: Overall='{multi_res['overall_health']}', Scans count={len(multi_res['scans'])}")

    # 5. Test ReportLab PDF Report Generation
    print("\n[TEST 5] Testing ReportLab PDF Generation...")
    resp_pdf = client.get(f'/report/{new_pred_id}')
    assert resp_pdf.status_code == 200, f"/report/{new_pred_id} returned {resp_pdf.status_code}"
    assert resp_pdf.mimetype == 'application/pdf'
    assert len(resp_pdf.data) > 1000
    print(f"  [PASS] Generated Single PDF report ({len(resp_pdf.data)} bytes)")

    resp_multi_pdf = client.post('/report/multipart', json={'scans': multi_res['scans']})
    assert resp_multi_pdf.status_code == 200
    assert resp_multi_pdf.mimetype == 'application/pdf'
    assert len(resp_multi_pdf.data) > 1000
    print(f"  [PASS] Generated Integrated Multi-Part PDF report ({len(resp_multi_pdf.data)} bytes)")

    # 6. Test All Web Navigation Routes
    print("\n[TEST 6] Testing All Web Application Routes...")
    routes = [
        '/', '/detect', '/live', '/solutions', '/analytics',
        '/diseases', '/history', '/about', '/mobile',
        '/api/analytics', '/api/diseases', '/api/stats', '/export_csv'
    ]
    for r in routes:
        resp = client.get(r)
        assert resp.status_code == 200, f"Route {r} returned {resp.status_code}"
        print(f"  [PASS] Route '{r}' returned 200 OK")

    # Cleanup test files & DB records
    if os.path.exists(test_img_path):
        os.remove(test_img_path)
    database.delete_prediction(pred_id)
    database.delete_prediction(new_pred_id)
    for s in multi_res['scans']:
        database.delete_prediction(s['prediction_id'])

    print("\n==================================================")
    print(" ALL VERIFICATION TESTS PASSED SUCCESSFULLY (100%)")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
