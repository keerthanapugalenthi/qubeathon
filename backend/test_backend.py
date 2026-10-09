"""
Automated validation script for BIS VerifyLens Flask Backend & SQLite Database.
"""
import json
from app import app
from db import init_db, get_all_cases

def run_tests():
    print("==================================================")
    print("Testing BIS VerifyLens Backend & SQLite Database")
    print("==================================================")

    init_db()
    client = app.test_client()

    # 1. Test Health Endpoint
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[PASS] GET /api/health returned 200 OK")

    # 2. Test Synthetic Samples Endpoint
    res = client.get("/api/samples")
    assert res.status_code == 200
    samples_data = res.get_json()
    assert len(samples_data["samples"]) >= 5, "Expected at least 5 synthetic samples"
    for s in samples_data["samples"]:
        assert s["is_synthetic"] is True, "Sample case must be explicitly marked synthetic"
    print(f"[PASS] GET /api/samples returned {len(samples_data['samples'])} correctly labeled synthetic samples")

    # 3. Test Screening: Plausible Format Case
    # Important rule: MUST NOT be called "valid" or "certified"
    plausible_payload = {
        "product_name": "Test Mineral Water",
        "text": "Conforms to IS 14543. Standard ISI mark with License CM/L-7654321.",
        "source_type": "text_input",
        "is_synthetic": True
    }
    res = client.post("/api/screen", json=plausible_payload)
    assert res.status_code == 200, f"Screen failed: {res.status_code}"
    data = res.get_json()
    assert data["risk_level"] == "PLAUSIBLE_FORMAT_UNVERIFIED", f"Unexpected risk level: {data['risk_level']}"
    assert "Official Check Required" in data["risk_label"]
    assert "NOT proof of genuine certification" in data["disclaimer"]
    print(f"[PASS] Plausible format labeled non-judgmentally as: '{data['risk_label']}'")

    # 4. Test Screening: Deceptive 'BIS Approved' claim
    deceptive_payload = {
        "product_name": "Test Extension Cord",
        "text": "100% BIS Approved and manufactured by an ISI Certified Company!",
        "source_type": "text_input",
        "is_synthetic": True
    }
    res = client.post("/api/screen", json=deceptive_payload)
    assert res.status_code == 200
    data2 = res.get_json()
    assert data2["risk_level"] == "RED_FLAG_HIGH_DISCREPANCY"
    assert any("BIS Approved" in r for r in data2["reasons"])
    print(f"[PASS] Deceptive 'BIS Approved' caught as: '{data2['risk_label']}'")

    # 5. Test Screening: Malformed CM/L length (e.g. 4 digits instead of 7)
    malformed_payload = {
        "product_name": "Test Helmet",
        "text": "Conforms to IS 4151. ISI Mark CM/L-4321.",
        "source_type": "text_input",
        "is_synthetic": True
    }
    res = client.post("/api/screen", json=malformed_payload)
    assert res.status_code == 200
    data3 = res.get_json()
    assert data3["risk_level"] == "RED_FLAG_HIGH_DISCREPANCY"
    assert any("Malformed CM/L" in r for r in data3["reasons"])
    print(f"[PASS] Malformed 4-digit CM/L caught as: '{data3['risk_label']}'")

    # 6. Test SQLite Persistence: Fetch All Cases
    res = client.get("/api/cases")
    assert res.status_code == 200
    cases_list = res.get_json()
    assert cases_list["total"] >= 3, "Cases should have been saved to SQLite"
    print(f"[PASS] GET /api/cases verified: {cases_list['total']} cases stored in SQLite")

    # 7. Test SQLite Persistence: Fetch by Case ID
    case_id = data["case_id"]
    res = client.get(f"/api/cases/{case_id}")
    assert res.status_code == 200
    fetched_case = res.get_json()["case"]
    assert fetched_case["case_id"] == case_id
    assert fetched_case["is_synthetic"] == 1
    print(f"[PASS] GET /api/cases/{case_id} fetched detailed case record correctly")

    print("==================================================")
    print("ALL BACKEND & DATABASE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
