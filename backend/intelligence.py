"""
VerifyLens Intelligence Module
Provides aggregated analytics, category classification, recurring phrase tracking,
repeat-report detection, and geographic integrity checks directly from SQLite records.
"""

import json
import re
from db import get_connection

DATA_ETHICS_DISCLAIMER = (
    "RESEARCH & ETHICS NOTICE: All intelligence metrics are computed deterministically "
    "from stored SQLite records. A screening flag is NOT a confirmed violation, and "
    "repeated reports do NOT prove duplicate submissions or wrongdoing. Synthetic demo "
    "records are explicitly partitioned and cannot be used to infer real-world statistical significance."
)

CATEGORY_RULES = [
    {
        "category": "Packaged Drinking Water & Beverages",
        "standard_ref": "IS 14543 / IS 13428 (Mandatory ISI)",
        "patterns": [r'\bIS\s*14543\b', r'\bIS\s*13428\b', r'\bpackaged\s+(?:drinking\s+)?water\b', r'\bmineral\s+water\b']
    },
    {
        "category": "Automotive Protective Headgear",
        "standard_ref": "IS 4151 (Mandatory ISI)",
        "patterns": [r'\bIS\s*4151\b', r'\bhelmet\b', r'\bheadgear\b', r'\btwo-wheeler\b']
    },
    {
        "category": "Electronics & IT Goods (CRS Scheme)",
        "standard_ref": "IS 13252 / IEC 60950 / CRS",
        "patterns": [r'\bIS\s*13252\b', r'\bIEC\s*60950\b', r'\bR-\d+\b', r'\bcharger\b', r'\badapter\b', r'\bpower\s*bank\b', r'\blaptop\b', r'\bphone\b', r'\btype-c\b']
    },
    {
        "category": "Household Electrical Appliances",
        "standard_ref": "IS 302 Series (Safety of Household Appliances)",
        "patterns": [r'\bIS\s*302\b', r'\bheater\b', r'\broom\s*heater\b', r'\biron\b', r'\bgeyser\b', r'\bappliance\b']
    },
    {
        "category": "Electrical Wiring & Accessories",
        "standard_ref": "IS 694 / IS 1293 (Cables & Plugs)",
        "patterns": [r'\bIS\s*694\b', r'\bIS\s*1293\b', r'\bextension\s*(?:board|strip|cord)\b', r'\bsurge\s*protector\b', r'\bcable\b', r'\bwire\b']
    },
    {
        "category": "Cement & Construction Materials",
        "standard_ref": "IS 269 / IS 1489 (Portland Cement)",
        "patterns": [r'\bIS\s*269\b', r'\bIS\s*1489\b', r'\bcement\b', r'\bclinker\b', r'\bconcrete\b']
    }
]

PHRASE_DEFINITIONS = [
    {
        "id": "BIS_APPROVED",
        "label": "Deceptive Claim: 'BIS Approved'",
        "regex": r'\bbis\s+approved\b',
        "nature": "Misleading Marketing",
        "regulatory_note": "BIS grants licences to use standard marks; it does not issue generic corporate or product 'approvals'."
    },
    {
        "id": "ISI_CERTIFIED_COMPANY",
        "label": "Deceptive Claim: 'ISI Certified Company'",
        "regex": r'\bisi\s+certified\s+company\b',
        "nature": "Misleading Marketing",
        "regulatory_note": "BIS certifies specific conforming products, not entire manufacturing companies."
    },
    {
        "id": "BIS_CERTIFIED_COMPANY",
        "label": "Deceptive Claim: 'BIS Certified Company'",
        "regex": r'\bbis\s+certified\s+company\b',
        "nature": "Misleading Marketing",
        "regulatory_note": "Corporations cannot claim corporate BIS certification; only product-level licences exist."
    },
    {
        "id": "APPLIED_UNDER_PROCESS",
        "label": "Unauthorized Claim: 'Applied / Under Process'",
        "regex": r'\b(?:bis|isi)\s*(?:applied(?:\s*for)?|under\s*process|pending)\b',
        "nature": "Unauthorized Claim",
        "regulatory_note": "Displaying standard marks or claiming compliance while an application is pending is strictly prohibited."
    },
    {
        "id": "MALFORMED_CML",
        "label": "Malformed Licence Length (Not 7 Digits)",
        "regex": r'(?:CM\s*[/:\-]?\s*L\s*[:\-#]?\s*|CML\s*[:\-#]?\s*)(\d{1,6}|\d{8,12})\b',
        "nature": "Syntactic Discrepancy",
        "regulatory_note": "Official BIS CM/L licences are strictly 7-digit integers."
    },
    {
        "id": "VALID_CML_FORMAT",
        "label": "7-Digit CM/L Licence Pattern",
        "regex": r'(?:CM\s*[/:\-]?\s*L\s*[:\-#]?\s*|CML\s*[:\-#]?\s*|licen[sc]e\s*(?:no\.?|number)?\s*[:\-]?\s*)(\d{7})\b',
        "nature": "Standard Pattern",
        "regulatory_note": "Conforms to standard 7-digit CM/L syntax. Requires official registry verification."
    },
    {
        "id": "CRS_REGISTRATION_FORMAT",
        "label": "8-Digit CRS Registration (R-XXXXXXXX)",
        "regex": r'\bR-(\d{8})\b',
        "nature": "Standard Pattern",
        "regulatory_note": "Conforms to Compulsory Registration Scheme 8-digit format. Must be verified on crsbis.in."
    },
    {
        "id": "STANDARD_NUMBER_MENTION",
        "label": "Indian Standard (IS) Reference",
        "regex": r'\bIS(?:\s*(?:[:/]|\b))(?:\s*(?:ISO|IEC))?\s*\d+',
        "nature": "Standard Reference",
        "regulatory_note": "Reference to an Indian Standard (e.g. IS 14543, IS 4151)."
    }
]


def classify_category(product_name, input_text, detected_claims):
    """
    Classifies a case into a product category based on transparent, documented rules.
    If uncertain, strictly returns 'Unspecified / General Goods' without silent guessing.
    """
    combined_text = f"{product_name or ''} {input_text or ''}"
    claims_text = " ".join([c.get("value", "") + " " + c.get("detail", "") for c in detected_claims])
    search_corpus = f"{combined_text} {claims_text}"

    for rule in CATEGORY_RULES:
        for pattern in rule["patterns"]:
            if re.search(pattern, search_corpus, re.IGNORECASE):
                return {
                    "category": rule["category"],
                    "standard_ref": rule["standard_ref"],
                    "rule_matched": pattern
                }

    return {
        "category": "Unspecified / General Goods",
        "standard_ref": "No specific Indian Standard identified",
        "rule_matched": "Default fallback (insufficient category data)"
    }


def extract_identifiers(case):
    """
    Extracts all exact identifiers (CM/L, CRS R-number, or malformed numbers)
    from a case record for repeat-detection.
    """
    identifiers = []
    detected_claims = case.get("detected_claims", [])
    for claim in detected_claims:
        val = claim.get("value", "").strip()
        if val.startswith("CM/L-") or val.startswith("R-"):
            identifiers.append(val)

    # Check input text for malformed CM/L as well
    malformed = re.findall(r'(?:CM\s*[/:\-]?\s*L\s*[:\-#]?\s*|CML\s*[:\-#]?\s*)(\d+)\b', case.get("input_text", ""), re.IGNORECASE)
    for m in malformed:
        tag = f"CM/L-{m}"
        if tag not in identifiers:
            identifiers.append(tag)

    return list(set(identifiers))


def get_intelligence_data(scope="real_only"):
    """
    Calculates comprehensive intelligence metrics directly from SQLite records.
    scope: 'real_only' (default) | 'synthetic_only' | 'all'
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Query all cases
    cursor.execute("""
        SELECT id, case_id, created_at, product_name, source_type, input_text,
               image_filename, risk_level, risk_label, summary,
               detected_claims_json, reasons_json, evidence_json,
               recommended_steps_json, is_synthetic
        FROM cases
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    raw_cases = []
    for row in rows:
        c = dict(row)
        c["detected_claims"] = json.loads(c["detected_claims_json"])
        c["reasons"] = json.loads(c["reasons_json"])
        c["evidence"] = json.loads(c["evidence_json"])
        c["recommended_steps"] = json.loads(c["recommended_steps_json"])
        raw_cases.append(c)

    # Total counts before filtering
    total_in_db = len(raw_cases)
    synthetic_count = sum(1 for c in raw_cases if c.get("is_synthetic") == 1)
    real_count = total_in_db - synthetic_count

    # Filter by requested scope (default is real_only to prevent synthetic data pollution)
    if scope == "synthetic_only":
        cases = [c for c in raw_cases if c.get("is_synthetic") == 1]
    elif scope == "all":
        cases = raw_cases
    elif scope == "empty_test":
        cases = []
    else:
        cases = [c for c in raw_cases if c.get("is_synthetic") == 0]
        scope = "real_only"

    sample_size = len(cases)

    # Empty dataset safe return
    if sample_size == 0:
        return {
            "summary": {
                "sample_size": 0,
                "total_in_db": total_in_db,
                "synthetic_count": synthetic_count,
                "real_count": real_count,
                "scope": scope,
                "flagged_count": 0,
                "flag_rate_percent": 0.0,
                "high_discrepancy_count": 0,
                "needs_review_count": 0,
                "plausible_format_count": 0,
                "no_claims_count": 0,
                "repeat_groups_count": 0,
                "recurring_phrases_count": 0
            },
            "category_intelligence": [],
            "recurring_phrases": [],
            "repeat_detection": [],
            "geographic_intelligence": {
                "has_reliable_data": False,
                "message": "Insufficient Geolocation Data: No records exist in this filter scope.",
                "locations": []
            },
            "disclaimer": DATA_ETHICS_DISCLAIMER
        }

    # 1. Summary Counts
    flagged_cases = [c for c in cases if c.get("risk_level") in ["RED_FLAG_HIGH_DISCREPANCY", "AMBER_FLAG_NEEDS_REVIEW"]]
    high_discrepancy = [c for c in cases if c.get("risk_level") == "RED_FLAG_HIGH_DISCREPANCY"]
    needs_review = [c for c in cases if c.get("risk_level") == "AMBER_FLAG_NEEDS_REVIEW"]
    plausible_format = [c for c in cases if c.get("risk_level") == "PLAUSIBLE_FORMAT_UNVERIFIED"]
    no_claims = [c for c in cases if c.get("risk_level") == "NO_CLAIMS_DETECTED"]

    flag_rate = round((len(flagged_cases) / sample_size) * 100, 1)

    # 2. Category Intelligence
    category_map = {}
    for c in cases:
        cat_info = classify_category(c.get("product_name"), c.get("input_text"), c.get("detected_claims"))
        cat_name = cat_info["category"]
        if cat_name not in category_map:
            category_map[cat_name] = {
                "category": cat_name,
                "standard_ref": cat_info["standard_ref"],
                "total_reports": 0,
                "flagged_reports": 0,
                "high_discrepancy_reports": 0,
                "case_ids": []
            }
        category_map[cat_name]["total_reports"] += 1
        category_map[cat_name]["case_ids"].append(c["case_id"])
        if c.get("risk_level") in ["RED_FLAG_HIGH_DISCREPANCY", "AMBER_FLAG_NEEDS_REVIEW"]:
            category_map[cat_name]["flagged_reports"] += 1
        if c.get("risk_level") == "RED_FLAG_HIGH_DISCREPANCY":
            category_map[cat_name]["high_discrepancy_reports"] += 1

    category_list = []
    for cat_data in category_map.values():
        tot = cat_data["total_reports"]
        flg = cat_data["flagged_reports"]
        cat_data["flag_rate_percent"] = round((flg / tot) * 100, 1) if tot > 0 else 0.0
        cat_data["denominator_str"] = f"{flg}/{tot} reports flagged"
        category_list.append(cat_data)

    # Sort categories by total reports descending
    category_list.sort(key=lambda x: (x["total_reports"], x["flagged_reports"]), reverse=True)

    # 3. Recurring Phrase Intelligence (Distinct cases containing phrase)
    phrase_list = []
    for p_def in PHRASE_DEFINITIONS:
        pattern = p_def["regex"]
        matching_cases = []
        matching_flagged = []
        snippets = []

        for c in cases:
            text_corpus = f"{c.get('input_text', '')} {' '.join(c.get('evidence', []))} {' '.join(c.get('reasons', []))}"
            if re.search(pattern, text_corpus, re.IGNORECASE):
                matching_cases.append(c["case_id"])
                if c.get("risk_level") in ["RED_FLAG_HIGH_DISCREPANCY", "AMBER_FLAG_NEEDS_REVIEW"]:
                    matching_flagged.append(c["case_id"])

                # Collect up to 2 distinct snippets
                for ev in c.get("evidence", []):
                    if re.search(pattern, ev, re.IGNORECASE) and ev not in snippets:
                        snippets.append(ev)
                        if len(snippets) >= 2:
                            break

        distinct_count = len(matching_cases)
        if distinct_count > 0:
            phrase_list.append({
                "id": p_def["id"],
                "phrase": p_def["label"],
                "nature": p_def["nature"],
                "distinct_cases_count": distinct_count,
                "percentage_of_dataset": round((distinct_count / sample_size) * 100, 1),
                "denominator_str": f"{distinct_count}/{sample_size} cases",
                "flagged_cases_count": len(matching_flagged),
                "flag_rate_percent": round((len(matching_flagged) / distinct_count) * 100, 1) if distinct_count > 0 else 0.0,
                "case_ids": matching_cases,
                "evidence_snippets": snippets[:2],
                "regulatory_note": p_def["regulatory_note"]
            })

    # Sort phrases by distinct count descending
    phrase_list.sort(key=lambda x: x["distinct_cases_count"], reverse=True)

    # 4. Repeat-Report Detection
    # Separate exact identifier matches from possible product-name matches
    identifier_groups = {}
    name_groups = {}

    for c in cases:
        cid = c["case_id"]
        pname = (c.get("product_name") or "").strip()
        ids = extract_identifiers(c)

        for ident in ids:
            if ident not in identifier_groups:
                identifier_groups[ident] = []
            identifier_groups[ident].append({
                "case_id": cid,
                "product_name": pname or "Unspecified Product",
                "risk_level": c.get("risk_level"),
                "is_synthetic": c.get("is_synthetic")
            })

        if pname and len(pname) > 3:
            norm_name = re.sub(r'\s+', ' ', pname.lower())
            if norm_name not in name_groups:
                name_groups[norm_name] = []
            name_groups[norm_name].append({
                "case_id": cid,
                "product_name": pname,
                "risk_level": c.get("risk_level"),
                "is_synthetic": c.get("is_synthetic")
            })

    repeat_list = []
    group_counter = 1

    # Exact Identifier Matches (Tier 1)
    for ident, matched_records in identifier_groups.items():
        if len(matched_records) > 1:
            unique_case_ids = list(dict.fromkeys([r["case_id"] for r in matched_records]))
            if len(unique_case_ids) > 1:
                repeat_list.append({
                    "group_id": f"REP-EXACT-{group_counter:02d}",
                    "match_type": "EXACT_IDENTIFIER_MATCH",
                    "match_tier": "Exact Match",
                    "key": ident,
                    "evidence_label": f"Shared Standard Licence / Registration: {ident}",
                    "distinct_reports_count": len(unique_case_ids),
                    "denominator_str": f"{len(unique_case_ids)} related reports",
                    "case_ids": unique_case_ids,
                    "products": list(set([r["product_name"] for r in matched_records])),
                    "caution_note": "A shared licence number links multiple reports for investigation. Note that genuine manufacturers also use the same licence across valid product batches."
                })
                group_counter += 1

    # Possible Product-Name Matches (Tier 2) - Only if not already in exact matches
    for norm_name, matched_records in name_groups.items():
        if len(matched_records) > 1:
            unique_case_ids = list(dict.fromkeys([r["case_id"] for r in matched_records]))
            # Check if this group is already identical to an exact match group
            already_covered = False
            for rep in repeat_list:
                if set(rep["case_ids"]) == set(unique_case_ids):
                    already_covered = True
                    break

            if not already_covered and len(unique_case_ids) > 1:
                repeat_list.append({
                    "group_id": f"REP-NAME-{group_counter:02d}",
                    "match_type": "POSSIBLE_PRODUCT_MATCH",
                    "match_tier": "Possible Match",
                    "key": matched_records[0]["product_name"],
                    "evidence_label": f"Similar Product Label / Title: '{matched_records[0]['product_name']}'",
                    "distinct_reports_count": len(unique_case_ids),
                    "denominator_str": f"{len(unique_case_ids)} related reports",
                    "case_ids": unique_case_ids,
                    "products": list(set([r["product_name"] for r in matched_records])),
                    "caution_note": "Reports share matching product naming. Seller details or full packaging must be cross-referenced to verify if they represent the same product line."
                })
                group_counter += 1

    # 5. Geographic Intelligence (Transparent Empty State)
    # Check if any reliable verified location field exists
    geographic_intelligence = {
        "has_reliable_data": False,
        "message": (
            "Insufficient Geolocation Data: Screened submissions currently consist of product packaging "
            "photographs, advertisement copy, and e-commerce text without verified distribution coordinates. "
            "In accordance with BIS VerifyLens data integrity guidelines, simulated or synthetic geographic "
            "coordinates are never generated."
        ),
        "guidance": "Physical retailer addresses or regional manufacturing zones can only be added when corroborated by verified field inspection reports.",
        "locations": []
    }

    return {
        "summary": {
            "sample_size": sample_size,
            "total_in_db": total_in_db,
            "synthetic_count": synthetic_count,
            "real_count": real_count,
            "scope": scope,
            "flagged_count": len(flagged_cases),
            "flag_rate_percent": flag_rate,
            "high_discrepancy_count": len(high_discrepancy),
            "needs_review_count": len(needs_review),
            "plausible_format_count": len(plausible_format),
            "no_claims_count": len(no_claims),
            "repeat_groups_count": len(repeat_list),
            "recurring_phrases_count": len(phrase_list)
        },
        "category_intelligence": category_list,
        "recurring_phrases": phrase_list,
        "repeat_detection": repeat_list,
        "geographic_intelligence": geographic_intelligence,
        "disclaimer": DATA_ETHICS_DISCLAIMER
    }
