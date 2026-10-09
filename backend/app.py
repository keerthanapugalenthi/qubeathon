import os
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from db import init_db, insert_case, get_all_cases, get_case_by_id
from rules import (
    analyze_text_claims,
    SYNTHETIC_SAMPLE_CASES,
    REGULATORY_DISCLAIMER,
    OFFICIAL_VERIFICATION_RESOURCES
)

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests for the React frontend

# Base directory for storing uploaded images
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload size

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize SQLite database
init_db()

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "BIS VerifyLens Backend API",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/samples", methods=["GET"])
def get_samples():
    """Return clearly labeled synthetic demonstration cases."""
    return jsonify({
        "samples": SYNTHETIC_SAMPLE_CASES,
        "disclaimer": REGULATORY_DISCLAIMER
    })

@app.route("/api/screen", methods=["POST"])
def screen_claim():
    """
    Screen submitted product claims from text and/or uploaded image.
    Executes explainable regulatory rules and stores findings in SQLite.
    """
    try:
        product_name = ""
        input_text = ""
        source_type = "text_input"
        is_synthetic = False
        image_filename = None

        # Check if request is multipart/form-data (with file upload)
        if request.content_type and "multipart/form-data" in request.content_type:
            product_name = request.form.get("product_name", "").strip()
            input_text = request.form.get("text", "").strip()
            source_type = request.form.get("source_type", "image_upload")
            is_synthetic = request.form.get("is_synthetic", "false").lower() in ["true", "1"]

            if "image" in request.files:
                file = request.files["image"]
                if file and file.filename and allowed_file(file.filename):
                    orig_name = secure_filename(file.filename)
                    unique_prefix = uuid.uuid4().hex[:8]
                    image_filename = f"{unique_prefix}_{orig_name}"
                    save_path = os.path.join(app.config["UPLOAD_FOLDER"], image_filename)
                    file.save(save_path)
                    source_type = "image_upload"

        elif request.is_json:
            data = request.get_json() or {}
            product_name = data.get("product_name", "").strip()
            input_text = data.get("text", "").strip()
            source_type = data.get("source_type", "text_input")
            is_synthetic = bool(data.get("is_synthetic", False))

        if not input_text and not image_filename:
            return jsonify({
                "error": "Please provide product text to screen or an image."
            }), 400

        # Execute explainable screening rule engine
        analysis = analyze_text_claims(input_text, product_name=product_name)

        # Generate unique case ID
        case_id = f"CASE-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        # Prepare case record for SQLite
        case_record = {
            "case_id": case_id,
            "created_at": datetime.now().isoformat(),
            "product_name": product_name or "Unspecified Product",
            "source_type": source_type,
            "input_text": input_text,
            "image_filename": image_filename,
            "risk_level": analysis["risk_level"],
            "risk_label": analysis["risk_label"],
            "summary": analysis["summary"],
            "detected_claims": analysis["detected_claims"],
            "reasons": analysis["reasons"],
            "evidence": analysis["evidence"],
            "recommended_steps": analysis["recommended_steps"],
            "is_synthetic": is_synthetic
        }

        # Save to SQLite
        insert_case(case_record)

        # Return full response
        response_payload = {
            "case_id": case_id,
            "created_at": case_record["created_at"],
            "product_name": case_record["product_name"],
            "source_type": source_type,
            "input_text": input_text,
            "image_filename": image_filename,
            "is_synthetic": is_synthetic,
            **analysis
        }

        return jsonify(response_payload), 200

    except Exception as e:
        return jsonify({
            "error": f"An error occurred while screening: {str(e)}"
        }), 500

@app.route("/api/cases", methods=["GET"])
def list_cases():
    """Retrieve all screened cases stored in SQLite."""
    try:
        cases = get_all_cases()
        return jsonify({
            "cases": cases,
            "total": len(cases)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/cases/<case_id>", methods=["GET"])
def get_case(case_id):
    """Retrieve detailed report of a specific case."""
    try:
        case = get_case_by_id(case_id)
        if not case:
            return jsonify({"error": f"Case with ID '{case_id}' not found."}), 404
        return jsonify({
            "case": case,
            "disclaimer": REGULATORY_DISCLAIMER,
            "official_resources": OFFICIAL_VERIFICATION_RESOURCES
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/uploads/<filename>", methods=["GET"])
def get_uploaded_file(filename):
    """Serve uploaded product label images."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

if __name__ == "__main__":
    print("Starting BIS VerifyLens Flask Backend on http://127.0.0.1:5000 ...")
    app.run(host="127.0.0.1", port=5000, debug=True)
