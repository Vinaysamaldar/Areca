import sqlite3
import os
import csv
import io
from datetime import datetime

# Vercel and serverless platforms have a read-only filesystem; only /tmp is writable
if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
    DB_DIR = '/tmp'
else:
    DB_DIR = os.path.dirname(os.path.abspath(__file__))

DB_FILE = os.path.join(DB_DIR, 'predictions.db')

def get_connection():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                image_url TEXT NOT NULL,
                part TEXT DEFAULT 'leaf',
                disease TEXT NOT NULL,
                disease_kn TEXT,
                confidence REAL NOT NULL,
                severity TEXT,
                low_confidence INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                notes TEXT
            )
        ''')
        # Safely migrate older schema if 'part' column is missing
        cursor.execute("PRAGMA table_info(predictions)")
        columns = [col['name'] for col in cursor.fetchall()]
        if 'part' not in columns:
            cursor.execute("ALTER TABLE predictions ADD COLUMN part TEXT DEFAULT 'leaf'")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[WARN] Error initializing database: {e}")

def add_prediction(filename, image_url, disease, disease_kn, confidence, severity="Moderate", part="leaf", low_confidence=False, notes=""):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO predictions (filename, image_url, part, disease, disease_kn, confidence, severity, low_confidence, created_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (filename, image_url, part, disease, disease_kn, float(confidence), severity, 1 if low_confidence else 0, created_at, notes))
        pred_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return pred_id
    except Exception as e:
        print(f"[ERROR] Could not insert prediction: {e}")
        return None

def get_all_predictions(limit=100):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, image_url, part, disease, disease_kn, confidence, severity, low_confidence, created_at, notes
            FROM predictions
            ORDER BY id DESC
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"[ERROR] Could not fetch predictions: {e}")
        return []

def get_prediction_by_id(pred_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, image_url, part, disease, disease_kn, confidence, severity, low_confidence, created_at, notes
            FROM predictions
            WHERE id = ?
        ''', (pred_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"[ERROR] Could not get prediction by id: {e}")
        return None

def delete_prediction(pred_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM predictions WHERE id = ?', (pred_id,))
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        return rows_affected > 0
    except Exception as e:
        print(f"[ERROR] Could not delete prediction: {e}")
        return False

def clear_all_predictions():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM predictions')
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[ERROR] Could not clear predictions: {e}")
        return False

def get_statistics():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM predictions')
        total_scans = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM predictions WHERE disease LIKE "%Healthy%"')
        healthy_scans = cursor.fetchone()[0]

        cursor.execute('''
            SELECT disease, COUNT(*) as count 
            FROM predictions 
            WHERE disease NOT LIKE "%Healthy%"
            GROUP BY disease 
            ORDER BY count DESC 
            LIMIT 1
        ''')
        top_disease_row = cursor.fetchone()
        most_frequent_disease = top_disease_row[0] if top_disease_row else "None"

        cursor.execute('SELECT AVG(confidence) FROM predictions')
        avg_conf = cursor.fetchone()[0]
        avg_confidence = round(avg_conf, 1) if avg_conf else 0.0

        conn.close()
        return {
            "total_scans": total_scans,
            "healthy_scans": healthy_scans,
            "diseased_scans": max(0, total_scans - healthy_scans),
            "healthy_pct": round((healthy_scans / total_scans * 100), 1) if total_scans > 0 else 0.0,
            "most_frequent_disease": most_frequent_disease,
            "avg_confidence": avg_confidence
        }
    except Exception as e:
        print(f"[ERROR] Could not calculate statistics: {e}")
        return {
            "total_scans": 0,
            "healthy_scans": 0,
            "diseased_scans": 0,
            "healthy_pct": 0.0,
            "most_frequent_disease": "None",
            "avg_confidence": 0.0
        }

def get_analytics_data(start_date=None, end_date=None, part_filter=None):
    """
    Returns aggregated data structures formatted specifically for Chart.js dashboard.
    Supports dynamic filtering by date range and plant part.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query_conditions = []
        params = []

        if start_date:
            query_conditions.append("date(created_at) >= date(?)")
            params.append(start_date)
        if end_date:
            query_conditions.append("date(created_at) <= date(?)")
            params.append(end_date)
        if part_filter and part_filter.lower() != 'all':
            query_conditions.append("LOWER(part) = LOWER(?)")
            params.append(part_filter)

        where_clause = " WHERE " + " AND ".join(query_conditions) if query_conditions else ""

        # 1. Total Scans & Summary Metrics
        cursor.execute(f"SELECT COUNT(*), AVG(confidence) FROM predictions{where_clause}", params)
        row = cursor.fetchone()
        total_scans = row[0] or 0
        avg_conf = round(row[1] or 0.0, 1)

        # 2. Disease Distribution (Doughnut Chart)
        cursor.execute(f'''
            SELECT disease, COUNT(*) as count 
            FROM predictions{where_clause}
            GROUP BY disease 
            ORDER BY count DESC
        ''', params)
        disease_rows = cursor.fetchall()
        disease_distribution = {
            "labels": [r[0] for r in disease_rows] or ["No Data"],
            "counts": [r[1] for r in disease_rows] or [0]
        }

        # 3. Scans by Plant Part (Bar Chart)
        cursor.execute(f'''
            SELECT COALESCE(part, 'leaf') as p, COUNT(*) as count 
            FROM predictions{where_clause}
            GROUP BY p 
            ORDER BY count DESC
        ''', params)
        part_rows = cursor.fetchall()
        part_distribution = {
            "labels": [r[0].capitalize() for r in part_rows] or ["Leaf", "Stem", "Root", "Nut"],
            "counts": [r[1] for r in part_rows] or [0, 0, 0, 0]
        }

        # 4. Scans Over Time Trend (Line Chart)
        cursor.execute(f'''
            SELECT date(created_at) as dt, COUNT(*) as count 
            FROM predictions{where_clause}
            GROUP BY dt 
            ORDER BY dt ASC
            LIMIT 30
        ''', params)
        timeline_rows = cursor.fetchall()
        timeline_distribution = {
            "dates": [r[0] for r in timeline_rows] or [datetime.now().strftime("%Y-%m-%d")],
            "counts": [r[1] for r in timeline_rows] or [0]
        }

        # 5. Average Confidence per Disease (Bar Chart)
        cursor.execute(f'''
            SELECT disease, AVG(confidence) as avg_c 
            FROM predictions{where_clause}
            GROUP BY disease 
            ORDER BY avg_c DESC
        ''', params)
        conf_rows = cursor.fetchall()
        confidence_by_disease = {
            "labels": [r[0] for r in conf_rows] or ["No Data"],
            "averages": [round(r[1], 1) for r in conf_rows] or [0.0]
        }

        # 6. Healthy vs Diseased Ratio
        healthy_where = (where_clause + " AND disease LIKE '%Healthy%'") if where_clause else " WHERE disease LIKE '%Healthy%'"
        cursor.execute(f"SELECT COUNT(*) FROM predictions{healthy_where}", params)
        healthy_count = cursor.fetchone()[0] or 0
        diseased_count = max(0, total_scans - healthy_count)
        healthy_vs_diseased = {
            "labels": ["Healthy", "Diseased"],
            "counts": [healthy_count, diseased_count]
        }

        # 7. Severity Breakdown
        cursor.execute(f'''
            SELECT COALESCE(severity, 'Moderate') as sev, COUNT(*) as count 
            FROM predictions{where_clause}
            GROUP BY sev 
            ORDER BY count DESC
        ''', params)
        sev_rows = cursor.fetchall()
        severity_breakdown = {
            "labels": [r[0] for r in sev_rows] or ["Normal", "Moderate", "High", "Critical"],
            "counts": [r[1] for r in sev_rows] or [0, 0, 0, 0]
        }

        # Most common disease
        top_disease = disease_distribution["labels"][0] if disease_distribution["labels"] and disease_distribution["labels"][0] != "No Data" else "None"

        conn.close()
        return {
            "total_scans": total_scans,
            "avg_confidence": avg_conf,
            "healthy_pct": round((healthy_count / total_scans * 100), 1) if total_scans > 0 else 0.0,
            "most_common_disease": top_disease,
            "disease_distribution": disease_distribution,
            "part_distribution": part_distribution,
            "timeline_distribution": timeline_distribution,
            "confidence_by_disease": confidence_by_disease,
            "healthy_vs_diseased": healthy_vs_diseased,
            "severity_breakdown": severity_breakdown
        }
    except Exception as e:
        print(f"[ERROR] Could not fetch analytics data: {e}")
        return {}

def export_predictions_csv():
    """Generates an in-memory CSV string of all prediction records."""
    records = get_all_predictions(limit=10000)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Plant Part", "Disease Name", "Kannada Name", "Confidence (%)", "Severity", "Low Confidence Flag", "Filename"])
    for r in records:
        writer.writerow([
            r.get("id"),
            r.get("created_at"),
            r.get("part", "leaf"),
            r.get("disease"),
            r.get("disease_kn", ""),
            r.get("confidence"),
            r.get("severity"),
            "Yes" if r.get("low_confidence") else "No",
            r.get("filename")
        ])
    return output.getvalue()
