import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "verify_lens.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            product_name TEXT,
            source_type TEXT,
            input_text TEXT,
            image_filename TEXT,
            risk_level TEXT NOT NULL,
            risk_label TEXT NOT NULL,
            summary TEXT NOT NULL,
            detected_claims_json TEXT NOT NULL,
            reasons_json TEXT NOT NULL,
            evidence_json TEXT NOT NULL,
            recommended_steps_json TEXT NOT NULL,
            is_synthetic INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

def insert_case(case_data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO cases (
            case_id, created_at, product_name, source_type, input_text,
            image_filename, risk_level, risk_label, summary,
            detected_claims_json, reasons_json, evidence_json,
            recommended_steps_json, is_synthetic
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        case_data["case_id"],
        case_data.get("created_at", datetime.now().isoformat()),
        case_data.get("product_name", "Unspecified Product"),
        case_data.get("source_type", "text_input"),
        case_data.get("input_text", ""),
        case_data.get("image_filename"),
        case_data["risk_level"],
        case_data["risk_label"],
        case_data["summary"],
        json.dumps(case_data.get("detected_claims", [])),
        json.dumps(case_data.get("reasons", [])),
        json.dumps(case_data.get("evidence", [])),
        json.dumps(case_data.get("recommended_steps", [])),
        1 if case_data.get("is_synthetic", False) else 0
    ))
    conn.commit()
    conn.close()
    return case_data["case_id"]

def get_all_cases():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, case_id, created_at, product_name, source_type,
               risk_level, risk_label, summary, is_synthetic
        FROM cases
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_case_by_id(case_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cases WHERE case_id = ?", (case_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    data["detected_claims"] = json.loads(data["detected_claims_json"])
    data["reasons"] = json.loads(data["reasons_json"])
    data["evidence"] = json.loads(data["evidence_json"])
    data["recommended_steps"] = json.loads(data["recommended_steps_json"])
    return data
