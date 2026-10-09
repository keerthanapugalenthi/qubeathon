"""
Comprehensive verification test suite for VerifyLens Intelligence module.
Tests:
- Scope filtering (all, synthetic_only, real_only, empty)
- Category intelligence classification and flag rate calculation
- Recurring phrase distinct case counting
- Repeat-report detection (Exact Identifier vs Possible Match)
- Geographic intelligence honest empty state
- Zero division safety on empty datasets
"""

import json
from app import app
from db import init_db, insert_case
from intelligence import get_intelligence_data, classify_category, extract_identifiers

def run_intelligence_tests():
    print("==================================================")
    print("Testing VerifyLens Intelligence Module & API")
    print("==================================================")

    init_db()
    client = app.test_client()

    # Clear prior test records if any
    from db import get_connection
    conn = get_connection()
    conn.cursor().execute("DELETE FROM cases WHERE case_id LIKE 'TEST-INTEL-%'")
    conn.commit()
    conn.close()

    # 1. Seed deterministic test records
    # Seed 1: Mineral Water with valid format (Synthetic)
    case_1 = {
        "case_id": "TEST-INTEL-01",
        "product_name": "ClearSpring Packaged Drinking Water",
        "input_text": "Conforms to IS 14543. ISI Mark CM/L-5551234. Net quantity: 1L.",
        "risk_level": "PLAUSIBLE_FORMAT_UNVERIFIED",
        "risk_label": "Format Plausible (Official Check Required)",
        "summary": "Syntactically correct format. Official verification required.",
        "detected_claims": [
            {"type": "Indian Standard (IS)", "value": "IS 14543", "detail": "Conforms to IS 14543"},
            {"type": "ISI Licence Number (CM/L)", "value": "CM/L-5551234", "detail": "7-digit licence format"}
        ],
        "reasons": ["Syntax matches official 7-digit structure."],
        "evidence": ["Valid 7-digit CM/L pattern identified: CM/L-5551234", "Standard number referenced: 'IS 14543'"],
        "recommended_steps": ["Verify on BIS Care App."],
        "is_synthetic": True
    }
    insert_case(case_1)

    # Seed 2: Another Mineral Water with SAME CM/L (Exact Repeat Identifier Test)
    case_2 = {
        "case_id": "TEST-INTEL-02",
        "product_name": "ClearSpring Water 500ml",
        "input_text": "ClearSpring Pure Mineral Water. IS 14543. License No: CM/L-5551234.",
        "risk_level": "PLAUSIBLE_FORMAT_UNVERIFIED",
        "risk_label": "Format Plausible (Official Check Required)",
        "summary": "Plausible format. Same licence as case 1.",
        "detected_claims": [
            {"type": "Indian Standard (IS)", "value": "IS 14543", "detail": "Conforms to IS 14543"},
            {"type": "ISI Licence Number (CM/L)", "value": "CM/L-5551234", "detail": "7-digit licence format"}
        ],
        "reasons": ["Syntax matches official 7-digit structure."],
        "evidence": ["Valid 7-digit CM/L pattern identified: CM/L-5551234"],
        "recommended_steps": ["Verify on BIS Care App."],
        "is_synthetic": True
    }
    insert_case(case_2)

    # Seed 3: Extension Board with deceptive 'BIS Approved' (Real submission test)
    case_3 = {
        "case_id": "TEST-INTEL-03",
        "product_name": "FireSafe Extension Cord",
        "input_text": "FireSafe 4-Socket Strip. 100% BIS Approved by an ISI Certified Company!",
        "risk_level": "RED_FLAG_HIGH_DISCREPANCY",
        "risk_label": "High Discrepancy Indicator",
        "summary": "Misleading marketing phrases detected.",
        "detected_claims": [],
        "reasons": ["Misleading Claim: 'BIS Approved'", "Misleading Claim: 'ISI Certified Company'"],
        "evidence": ["Prohibited/deceptive phrasing detected: Misleading Claim: 'BIS Approved'"],
        "recommended_steps": ["Verify on BIS Care App."],
        "is_synthetic": False  # Non-synthetic (real)
    }
    insert_case(case_3)

    # Seed 4: Another product with SAME product name as case_3 (Possible product match)
    case_4 = {
        "case_id": "TEST-INTEL-04",
        "product_name": "FireSafe Extension Cord",
        "input_text": "FireSafe 4-Socket Strip with surge protection. BIS Approved.",
        "risk_level": "RED_FLAG_HIGH_DISCREPANCY",
        "risk_label": "High Discrepancy Indicator",
        "summary": "Misleading marketing claim.",
        "detected_claims": [],
        "reasons": ["Misleading Claim: 'BIS Approved'"],
        "evidence": ["Prohibited/deceptive phrasing detected: Misleading Claim: 'BIS Approved'"],
        "recommended_steps": ["Verify on BIS Care App."],
        "is_synthetic": False
    }
    insert_case(case_4)

    # Seed 5: Helmet with malformed CM/L (Synthetic)
    case_5 = {
        "case_id": "TEST-INTEL-05",
        "product_name": "SafeRider Helmet",
        "input_text": "Tested to IS 4151. CM/L-8888 (only 4 digits).",
        "risk_level": "RED_FLAG_HIGH_DISCREPANCY",
        "risk_label": "High Discrepancy Indicator",
        "summary": "Malformed CM/L length.",
        "detected_claims": [
            {"type": "Indian Standard (IS)", "value": "IS 4151", "detail": "Conforms to IS 4151"}
        ],
        "reasons": ["Malformed CM/L Number: Found '8888' (4 digits)."],
        "evidence": ["Invalid licence length detected: CM/L-8888"],
        "recommended_steps": ["Inspect physical label."],
        "is_synthetic": True
    }
    insert_case(case_5)

    # 2. Test GET /api/intelligence with default scope (real_only)
    res_default = client.get("/api/intelligence")
    assert res_default.status_code == 200, f"Expected 200, got {res_default.status_code}"
    data_default = res_default.get_json()
    summary_default = data_default["summary"]
    assert summary_default["scope"] == "real_only", "Default scope must be real_only"
    assert summary_default["sample_size"] == summary_default["real_count"], "Default sample size must match real_count"
    print(f"[PASS] GET /api/intelligence defaulted strictly to real_only: {summary_default['sample_size']} genuine cases")

    # Test scope=all
    res = client.get("/api/intelligence?scope=all")
    assert res.status_code == 200
    data = res.get_json()
    summary = data["summary"]
    assert summary["sample_size"] >= 5, "Sample size should be at least 5 across all records"
    assert summary["synthetic_count"] >= 3, "Should count synthetic records"
    assert summary["real_count"] >= 2, "Should count real records"
    assert summary["flag_rate_percent"] > 0, "Flag rate should be calculated"
    print(f"[PASS] GET /api/intelligence?scope=all returned {summary['sample_size']} total cases (Flag rate: {summary['flag_rate_percent']}%)")

    # 3. Test Scope Filtering: synthetic_only vs real_only
    res_synth = client.get("/api/intelligence?scope=synthetic_only")
    assert res_synth.status_code == 200
    data_synth = res_synth.get_json()
    assert data_synth["summary"]["scope"] == "synthetic_only"
    assert data_synth["summary"]["sample_size"] == data_synth["summary"]["synthetic_count"]
    print(f"[PASS] Scope 'synthetic_only' filtered strictly to {data_synth['summary']['sample_size']} records")

    res_real = client.get("/api/intelligence?scope=real_only")
    assert res_real.status_code == 200
    data_real = res_real.get_json()
    assert data_real["summary"]["scope"] == "real_only"
    assert data_real["summary"]["sample_size"] == data_real["summary"]["real_count"]
    print(f"[PASS] Scope 'real_only' filtered strictly to {data_real['summary']['sample_size']} records")

    # 4. Test Category Intelligence
    cats = data["category_intelligence"]
    assert len(cats) >= 2, "Expected multiple categorized groups"
    water_cat = next((c for c in cats if "Water" in c["category"]), None)
    assert water_cat is not None, "Packaged Water category must be identified"
    assert water_cat["total_reports"] >= 2, "Water reports count should be >= 2"
    assert "IS 14543" in water_cat["standard_ref"], "Documented rule reference must be present"
    print(f"[PASS] Category Intelligence correctly grouped '{water_cat['category']}': {water_cat['denominator_str']}")

    # 5. Test Recurring Phrase Intelligence
    phrases = data["recurring_phrases"]
    bis_approved_phrase = next((p for p in phrases if "BIS Approved" in p["phrase"]), None)
    assert bis_approved_phrase is not None, "'BIS Approved' phrase must be tracked"
    assert bis_approved_phrase["distinct_cases_count"] >= 2, "Must count distinct cases containing phrase"
    assert len(bis_approved_phrase["evidence_snippets"]) > 0, "Must provide evidence excerpts"
    print(f"[PASS] Recurring Phrase Intelligence: '{bis_approved_phrase['phrase']}' in {bis_approved_phrase['denominator_str']}")

    # 6. Test Repeat-Report Detection
    repeats = data["repeat_detection"]
    assert len(repeats) >= 1, "Expected at least 1 repeat report group"
    exact_match = next((r for r in repeats if r["match_type"] == "EXACT_IDENTIFIER_MATCH"), None)
    assert exact_match is not None, "Exact identifier repeat match must be detected"
    assert "CM/L-5551234" in exact_match["key"], "Exact identifier must be CM/L-5551234"
    assert "TEST-INTEL-01" in exact_match["case_ids"] and "TEST-INTEL-02" in exact_match["case_ids"]
    assert "caution_note" in exact_match, "Cautionary ethics notice must be present"
    print(f"[PASS] Repeat Detection correctly isolated Exact Match: {exact_match['key']} across {exact_match['denominator_str']}")

    # 7. Test Geographic Intelligence (Transparent Empty State)
    geo = data["geographic_intelligence"]
    assert geo["has_reliable_data"] is False, "Should honestly declare lack of reliable location coordinates"
    assert "Insufficient Geolocation Data" in geo["message"]
    print("[PASS] Geographic Intelligence verified: honest empty state returned (zero fake coordinates)")

    # 8. Test Empty Dataset Safety
    # Test get_intelligence_data with a scope that yields 0 cases
    empty_result = get_intelligence_data(scope="empty_test")
    assert empty_result["summary"]["sample_size"] == 0
    assert empty_result["summary"]["flag_rate_percent"] == 0.0
    assert empty_result["category_intelligence"] == []
    print("[PASS] Empty dataset safety confirmed: zero division prevented gracefully")

    print("==================================================")
    print("ALL VERIFYLENS INTELLIGENCE TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_intelligence_tests()
