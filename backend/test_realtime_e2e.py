"""
End-to-End Real-Time Workflow Verification for BIS VerifyLens.
Tests:
1. Real input submission (not synthetic)
2. Live rule-based screening & evidence extraction
3. Database persistence in SQLite
4. Real-time intelligence dashboard reflection (real_only scope)
5. Investigation report integrity & Official Verification route
"""

import json
from app import app

def test_full_realtime_flow():
    print("==================================================")
    print("Testing Full Real-Time Workflow (User -> SQLite -> Intelligence)")
    print("==================================================")

    client = app.test_client()

    # Step 1: Submit genuine real-world product listing (is_synthetic = False)
    real_payload = {
        "product_name": "PureFlow 20L Water Can",
        "text": (
            "PureFlow Commercial 20 Litre Packaged Drinking Water. Reverse osmosis purified. "
            "Manufactured to Indian Standard IS 14543. ISI Standard Mark CM/L-9988776. "
            "100% BIS Approved manufacturing facility for guaranteed purity."
        ),
        "source_type": "text_input",
        "is_synthetic": False  # Explicitly real user submission
    }

    res = client.post("/api/screen", json=real_payload)
    assert res.status_code == 200, f"Screening failed with status {res.status_code}"
    screen_data = res.get_json()

    case_id = screen_data["case_id"]
    assert case_id.startswith("CASE-"), f"Invalid case ID: {case_id}"
    assert screen_data["is_synthetic"] is False, "Case must NOT be marked synthetic"
    assert screen_data["risk_level"] == "RED_FLAG_HIGH_DISCREPANCY", "Should flag 'BIS Approved' claim"
    assert any("BIS Approved" in r for r in screen_data["reasons"])
    assert "official_verification" in screen_data, "Must include official verification details"
    assert screen_data["official_verification"]["live_api_status"] == "OFFICIAL_API_NOT_AVAILABLE"
    print(f"[PASS] 1. Live Screening succeeded: Case {case_id} analyzed with 'High Discrepancy' for deceptive claim")

    # Step 2: Verify SQLite persistence
    res_case = client.get(f"/api/cases/{case_id}")
    assert res_case.status_code == 200, f"Case {case_id} not found in SQLite"
    persisted = res_case.get_json()["case"]
    assert persisted["case_id"] == case_id
    assert persisted["product_name"] == "PureFlow 20L Water Can"
    assert persisted["is_synthetic"] == 0, "Persisted record in SQLite must have is_synthetic = 0"
    print(f"[PASS] 2. SQLite Persistence verified: Case record safely committed to database")

    # Step 3: Verify Live Intelligence Dashboard reflects this genuine submission in real_only view
    res_intel = client.get("/api/intelligence?scope=real_only")
    assert res_intel.status_code == 200
    intel_data = res_intel.get_json()
    summary = intel_data["summary"]
    assert summary["scope"] == "real_only", "Default/selected scope must be real_only"
    assert summary["sample_size"] >= 1, "Real-only sample size must be at least 1"
    assert summary["real_count"] >= 1, "Real count must be at least 1"

    # Category check: Water category must exist in real_only
    water_cat = next((c for c in intel_data["category_intelligence"] if "Water" in c["category"]), None)
    assert water_cat is not None, "Real-only view must classify PureFlow as Packaged Water"
    assert case_id in water_cat["case_ids"], f"Case {case_id} must be listed in Water category"
    print(f"[PASS] 3. Live Intelligence updated: Category '{water_cat['category']}' links Case {case_id}")

    # Recurring phrases check: 'BIS Approved' must be present in real-only phrases
    bis_app_phrase = next((p for p in intel_data["recurring_phrases"] if "BIS Approved" in p["phrase"]), None)
    assert bis_app_phrase is not None, "'BIS Approved' phrase must be present in real intelligence"
    assert case_id in bis_app_phrase["case_ids"], f"Case {case_id} must be tracked in 'BIS Approved' phrase"
    print(f"[PASS] 4. Recurring Phrase Intelligence updated: 'BIS Approved' counted in {bis_app_phrase['denominator_str']}")

    # Step 4: Verify Investigation Report content
    report_res = client.get(f"/api/cases/{case_id}")
    report_json = report_res.get_json()
    assert "official_resources" in report_json
    assert len(report_json["official_resources"]) >= 3
    print(f"[PASS] 5. Investigation Dossier verified: Official verification routes and evidence linked")

    print("==================================================")
    print("ALL REAL-TIME END-TO-END WORKFLOW TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_full_realtime_flow()
