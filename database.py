import sqlite3
import os
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'predictions.db')

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            image_url TEXT NOT NULL,
            disease TEXT NOT NULL,
            disease_kn TEXT,
            confidence REAL NOT NULL,
            severity TEXT,
            low_confidence INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            notes TEXT
        )
    ''')
    conn.commit()
    conn.close()

def add_prediction(filename, image_url, disease, disease_kn, confidence, severity="Moderate", low_confidence=False, notes=""):
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO predictions (filename, image_url, disease, disease_kn, confidence, severity, low_confidence, created_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (filename, image_url, disease, disease_kn, float(confidence), severity, 1 if low_confidence else 0, created_at, notes))
    pred_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pred_id

def get_all_predictions(limit=100):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, filename, image_url, disease, disease_kn, confidence, severity, low_confidence, created_at, notes
        FROM predictions
        ORDER BY id DESC
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_prediction_by_id(pred_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, filename, image_url, disease, disease_kn, confidence, severity, low_confidence, created_at, notes
        FROM predictions
        WHERE id = ?
    ''', (pred_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_prediction(pred_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM predictions WHERE id = ?', (pred_id,))
    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()
    return rows_affected > 0

def clear_all_predictions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM predictions')
    conn.commit()
    conn.close()
    return True

def get_statistics():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total FROM predictions')
    total = cursor.fetchone()['total']

    cursor.execute('''
        SELECT disease, COUNT(*) as count 
        FROM predictions 
        GROUP BY disease 
        ORDER BY count DESC
    ''')
    disease_counts = [dict(r) for r in cursor.fetchall()]

    cursor.execute('SELECT AVG(confidence) as avg_conf FROM predictions')
    avg_conf_row = cursor.fetchone()
    avg_conf = round(avg_conf_row['avg_conf'], 2) if (avg_conf_row and avg_conf_row['avg_conf']) else 0.0

    conn.close()
    return {
        "total_scans": total,
        "disease_counts": disease_counts,
        "average_confidence": avg_conf
    }
