"""
Automated Verification Suite for Arecanut Disease Detection Web App
Tests database, model manager, routes, and prediction API
"""
import os
import io
import json
import sys
from PIL import Image

# Ensure standard output uses UTF-8 if possible
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def run_tests():
    print("==================================================")
    print(" Running System Verification Suite...")
    print("==================================================")

    # 1. Test Database
    print("\n[TEST 1] Testing SQLite Database...")
    import database
    database.init_db()
    pred_id = database.add_prediction(
        filename="test_sample.jpg",
        image_url="/static/uploads/test_sample.jpg",
        disease="Koleroga (Fruit Rot)",
        disease_kn="ಕೊಳೆರೋಗ / ಮಹಾಲಿ (ಕಾಯಿ ಕೊಳೆ)",
        confidence=94.5,
        severity="Critical",
        low_confidence=False
    )
    print(f"  [PASS] Successfully added prediction record (ID: {pred_id})")

    records = database.get_all_predictions()
    assert len(records) > 0, "No records returned from get_all_predictions()"
    print(f"  [PASS] Retrieved {len(records)} prediction records from database")

    stats = database.get_statistics()
    print(f"  [PASS] Database stats: {stats}")

    # 2. Test ModelManager
    print("\n[TEST 2] Testing ModelManager Inference Engine...")
    from model_helper import model_manager
    print(f"  [PASS] ModelManager active mode: {model_manager.mode}")

    # Create dummy image for testing
    test_img = Image.new('RGB', (224, 224), color=(34, 197, 94))
    test_img_path = os.path.join(os.path.dirname(__file__), 'test_leaf.jpg')
    test_img.save(test_img_path)

    result = model_manager.predict(test_img_path)
    print(f"  [PASS] Inference Result: {result['disease']} ({result['confidence']}%)")
    print(f"  [PASS] Low confidence flag: {result['low_confidence']}")
    assert 'probabilities' in result
    assert len(result['probabilities']) == 6
    print(f"  [PASS] 6 Class Probabilities verified: {list(result['probabilities'].keys())}")

    # Clean up test leaf image
    if os.path.exists(test_img_path):
        os.remove(test_img_path)

    # 3. Test Flask Web Application Routes
    print("\n[TEST 3] Testing Flask Routes & Endpoints...")
    from app import app
    client = app.test_client()

    routes = ['/', '/detect', '/diseases', '/history', '/about', '/api/diseases', '/api/stats', '/api/history']
    for r in routes:
        resp = client.get(r)
        assert resp.status_code == 200, f"Route {r} returned {resp.status_code}"
        print(f"  [PASS] Route '{r}' returned 200 OK")

    # 4. Test POST /predict API with valid image
    print("\n[TEST 4] Testing POST /predict Endpoint...")
    byte_io = io.BytesIO()
    test_img = Image.new('RGB', (224, 224), color=(180, 80, 40))
    test_img.save(byte_io, 'JPEG')
    byte_io.seek(0)

    data = {
        'image': (byte_io, 'test_upload.jpg')
    }
    resp = client.post('/predict', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200, f"/predict returned {resp.status_code}: {resp.data}"
    pred_res = json.loads(resp.data.decode('utf-8'))
    assert pred_res['success'] is True
    print(f"  [PASS] /predict API returned success: Disease='{pred_res['disease']}', Confidence={pred_res['confidence']}%")

    # Clean up test database record
    database.delete_prediction(pred_id)
    if 'prediction_id' in pred_res:
        database.delete_prediction(pred_res['prediction_id'])

    print("\n==================================================")
    print(" ALL VERIFICATION TESTS PASSED SUCCESSFULLY (100%)")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
