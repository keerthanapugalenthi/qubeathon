import re

# Regulatory References (Official BIS Standards Context):
# - BIS Act 2016 & BIS (Conformity Assessment) Regulations 2018
# - ISI Mark Scheme: Requires Indian Standard Number (IS:XXXX) on top and 7-digit CM/L (Licence) number at bottom.
# - CRS Scheme: Requires "Self Declaration - Conforming to IS XXXX", 8-digit R-number (R-XXXXXXXX), and portal reference.
# - Hallmarking: Requires BIS Triangle logo + Purity + 6-character alphanumeric HUID.
# - Prohibited / Misleading claims: "BIS Approved", "ISI Certified Company", "BIS Applied/Under Process".

REGULATORY_DISCLAIMER = (
    "SCREENING NOTICE: This automated screening tool identifies indicators for review. "
    "A detected indicator is NOT legal proof of a violation, and a plausible format is "
    "NOT proof of genuine certification. Always verify against official BIS portals."
)

OFFICIAL_VERIFICATION_RESOURCES = [
    {
        "name": "BIS Care Mobile App",
        "description": "Official app (Android/iOS) to 'Verify Licence Details' (CM/L) and 'Verify R-Number' (CRS) in real time.",
        "url": "https://www.bis.gov.in"
    },
    {
        "name": "Manakonline Portal (e-BIS)",
        "description": "Search licensee by CM/L number or manufacturer name to confirm active status and product scope.",
        "url": "https://www.manakonline.in"
    },
    {
        "name": "CRS Registration Portal",
        "description": "Search electronics/IT registrations by R-XXXXXXXX to confirm authorized brand and model.",
        "url": "https://www.crsbis.in"
    },
    {
        "name": "BIS Complaints Portal",
        "description": "Official consumer grievance and vigilance redressal portal to report suspected misuse.",
        "url": "https://www.services.bis.gov.in"
    }
]

# Clearly labeled synthetic demo cases for testing and evaluation
SYNTHETIC_SAMPLE_CASES = [
    {
        "id": "DEMO-01",
        "title": "Packaged Water with Standard ISI Mark Format",
        "product_name": "AquaPure Packaged Drinking Water 1L",
        "text": (
            "AquaPure Packaged Drinking Water. Processed through reverse osmosis and UV sterilization. "
            "Conforms to IS 14543. ISI Standard Mark displayed with License No: CM/L-8472910. "
            "Net quantity: 1000ml. Store in a cool dry place."
        ),
        "is_synthetic": True,
        "synthetic_notice": "[SYNTHETIC DEMO CASE - For Prototype Evaluation Only]"
    },
    {
        "id": "DEMO-02",
        "title": "Deceptive Marketing: 'BIS Approved' & 'ISI Certified Company'",
        "product_name": "PowerMax Heavy-Duty Extension Strip",
        "text": (
            "PowerMax 4-Way Surge Protector Extension Board. Made in India. "
            "100% BIS Approved product manufactured by an ISI Certified Company! "
            "High grade fire-retardant plastic. Best safety guaranteed."
        ),
        "is_synthetic": True,
        "synthetic_notice": "[SYNTHETIC DEMO CASE - For Prototype Evaluation Only]"
    },
    {
        "id": "DEMO-03",
        "title": "Motorcycle Helmet with Malformed (4-digit) CM/L Number",
        "product_name": "Apex Pro Two-Wheeler Protective Helmet",
        "text": (
            "Apex Pro Motorcycle Protective Helmet. Impact resistant ABS shell. "
            "Tested to Indian Standard IS 4151. ISI Mark: CM/L-4321. "
            "Sizes: L (580mm) to XL (600mm)."
        ),
        "is_synthetic": True,
        "synthetic_notice": "[SYNTHETIC DEMO CASE - For Prototype Evaluation Only]"
    },
    {
        "id": "DEMO-04",
        "title": "Laptop Power Adapter with CRS Registration Format",
        "product_name": "VoltPulse 65W Fast GaN Charger",
        "text": (
            "VoltPulse 65W Type-C GaN Travel Charger. Input: 100-240V ~ 50/60Hz 1.5A. "
            "Self Declaration - Conforming to IS 13252 (Part 1):2010 / IEC 60950-1. "
            "R-41009823. Visit www.crsbis.in for details."
        ),
        "is_synthetic": True,
        "synthetic_notice": "[SYNTHETIC DEMO CASE - For Prototype Evaluation Only]"
    },
    {
        "id": "DEMO-05",
        "title": "Unauthorized Marketing: 'BIS Applied / Under Process'",
        "product_name": "EcoBreeze Electric Room Heater 1500W",
        "text": (
            "EcoBreeze Instant Radiant Room Heater. Dual quartz heating tubes. "
            "ISI Mark applied for / BIS certification under process. "
            "Designed according to IS 302-2-30. Premium quality household appliance."
        ),
        "is_synthetic": True,
        "synthetic_notice": "[SYNTHETIC DEMO CASE - For Prototype Evaluation Only]"
    }
]


def analyze_text_claims(text, product_name=""):
    """
    Analyzes input text for BIS/ISI claims, licence numbers, and red flags.
    Returns an explainable, non-judgmental screening evaluation.
    """
    clean_text = text or ""
    detected_claims = []
    reasons = []
    evidence = []
    recommended_steps = []

    # 1. Detect Standard Numbers (e.g. IS 14543, IS 4151, IS 13252, IS/IEC 60950)
    is_matches = list(set(re.findall(
        r'\bIS(?:\s*(?:[:/]|\b))(?:\s*(?:ISO|IEC))?\s*\d+(?:\s*(?:part|pt|\:)\s*\d+)?(?:\s*:\s*\d{4})?\b',
        clean_text,
        re.IGNORECASE
    )))
    for std in is_matches:
        detected_claims.append({
            "type": "Indian Standard (IS)",
            "value": std.strip(),
            "detail": f"Product claims conformity to standard reference '{std.strip()}'."
        })
        evidence.append(f"Standard number referenced: '{std.strip()}'")

    # 2. Detect CM/L (ISI Licence) Numbers (Standard is 7 digits)
    cml_7digit_matches = list(set(re.findall(
        r'(?:CM\s*[/:\-]?\s*L\s*[:\-#]?\s*|CML\s*[:\-#]?\s*|licen[sc]e\s*(?:no\.?|number)?\s*[:\-]?\s*)(\d{7})\b',
        clean_text,
        re.IGNORECASE
    )))

    # Detect any CM/L pattern with incorrect length (not 7 digits)
    cml_all_matches = re.findall(
        r'(?:CM\s*[/:\-]?\s*L\s*[:\-#]?\s*|CML\s*[:\-#]?\s*)(\d+)\b',
        clean_text,
        re.IGNORECASE
    )
    malformed_cml = [m for m in cml_all_matches if len(m) != 7]

    for cml in cml_7digit_matches:
        detected_claims.append({
            "type": "ISI Licence Number (CM/L)",
            "value": f"CM/L-{cml}",
            "detail": f"7-digit licence format detected: CM/L-{cml}."
        })
        evidence.append(f"Valid 7-digit CM/L pattern identified: CM/L-{cml}")

    # 3. Detect CRS Registration Numbers (Standard is 8 digits: R-XXXXXXXX)
    crs_8digit_matches = list(set(re.findall(
        r'\bR-(\d{8})\b',
        clean_text,
        re.IGNORECASE
    )))
    malformed_crs = re.findall(r'\bR-(\d+)\b', clean_text, re.IGNORECASE)
    malformed_crs = [m for m in malformed_crs if len(m) != 8]

    for crs in crs_8digit_matches:
        detected_claims.append({
            "type": "CRS Registration Number",
            "value": f"R-{crs}",
            "detail": f"8-digit Compulsory Registration Scheme pattern: R-{crs}."
        })
        evidence.append(f"Standard 8-digit CRS registration pattern identified: R-{crs}")

    # 4. Detect General ISI or BIS Mentions
    has_isi_mention = bool(re.search(r'\b(isi|isi mark|isi standard)\b', clean_text, re.IGNORECASE))
    has_bis_mention = bool(re.search(r'\b(bis|bureau of indian standards)\b', clean_text, re.IGNORECASE))
    if has_isi_mention:
        evidence.append("Text mentions ISI or ISI Mark.")
    if has_bis_mention:
        evidence.append("Text mentions BIS or Bureau of Indian Standards.")

    # 5. Detect Misleading & Discrepancy Phrasings (Official Red Flags)
    deceptive_patterns = [
        (
            r'\bbis\s+approved\b',
            "Misleading Claim: 'BIS Approved'",
            "Under the BIS Act, BIS grants licences to use standard marks; it does not issue generic 'approvals'. This claim is misleading."
        ),
        (
            r'\bisi\s+certified\s+company\b',
            "Misleading Claim: 'ISI Certified Company'",
            "BIS certifies specific conforming products, not entire manufacturing companies. Claiming 'ISI Certified Company' is deceptive."
        ),
        (
            r'\bbis\s+certified\s+company\b',
            "Misleading Claim: 'BIS Certified Company'",
            "BIS certifies products under Indian Standards, not entire corporations."
        ),
        (
            r'\b(?:bis|isi)\s*(?:applied(?:\s*for)?|under\s*process|pending)\b',
            "Unauthorized Mark Claim: 'Applied / Under Process'",
            "Under BIS regulations, certification marks and claims cannot be used or displayed while an application is pending."
        ),
        (
            r'\biso\s*[/&]\s*isi\b',
            "Ambiguous Conflation: 'ISO/ISI'",
            "Conflating ISO management system certification with product-level ISI compliance without distinct licence details."
        )
    ]

    found_deceptive = []
    for pattern, label, explanation in deceptive_patterns:
        if re.search(pattern, clean_text, re.IGNORECASE):
            found_deceptive.append({"label": label, "explanation": explanation})
            reasons.append(f"{label}: {explanation}")
            evidence.append(f"Prohibited/deceptive phrasing detected: {label}")

    # 6. Evaluate Overall Screening Status (Explainable, Non-Judgmental)
    risk_level = "NO_CLAIMS_DETECTED"
    risk_label = "No BIS Claims Detected"
    summary = "No recognizable BIS or ISI standard mark claims were found in the submitted text."

    if found_deceptive or malformed_cml or malformed_crs:
        risk_level = "RED_FLAG_HIGH_DISCREPANCY"
        risk_label = "High Discrepancy Indicator"
        summary = (
            "One or more indicators strongly deviate from BIS regulatory guidelines "
            "(e.g., malformed licence length or prohibited marketing phrasing like 'BIS Approved')."
        )
        if malformed_cml:
            for bad_num in malformed_cml:
                reasons.append(
                    f"Malformed CM/L Number: Found '{bad_num}' ({len(bad_num)} digits). "
                    "Official BIS CM/L licences are strictly 7-digit numbers."
                )
                evidence.append(f"Invalid licence length detected: CM/L-{bad_num}")
        if malformed_crs:
            for bad_crs in malformed_crs:
                reasons.append(
                    f"Malformed CRS Number: Found 'R-{bad_crs}' ({len(bad_crs)} digits). "
                    "Official CRS registrations are strictly 8-digit numbers."
                )
                evidence.append(f"Invalid CRS length detected: R-{bad_crs}")

    elif has_isi_mention and not cml_7digit_matches:
        risk_level = "AMBER_FLAG_NEEDS_REVIEW"
        risk_label = "Needs Human Review (Missing Licence)"
        summary = (
            "Product text references ISI / BIS compliance, but does not state the mandatory "
            "7-digit CM/L licence number required to accompany the ISI mark."
        )
        reasons.append(
            "Missing Mandatory CM/L: Under BIS rules, any display of the ISI mark or claim "
            "must be accompanied by the 7-digit manufacturer licence number (CM/L-XXXXXXX)."
        )

    elif (cml_7digit_matches or crs_8digit_matches) and is_matches:
        risk_level = "PLAUSIBLE_FORMAT_UNVERIFIED"
        risk_label = "Format Plausible (Official Check Required)"
        summary = (
            "Extracted claims match the syntactic requirements (valid standard number and "
            "7-digit CM/L or 8-digit CRS registration). NOTE: A plausible format is NOT proof "
            "of an authentic, active licence. It must be checked against official BIS databases."
        )
        reasons.append(
            "Syntax matches official structure: The licence/standard numbers have correct lengths "
            "and formatting. However, format validity does not guarantee the licence is authentic or currently active."
        )

    elif cml_7digit_matches or crs_8digit_matches or is_matches:
        risk_level = "AMBER_FLAG_NEEDS_REVIEW"
        risk_label = "Needs Human Review (Incomplete Data)"
        summary = (
            "Partial certification patterns detected. Elements like the standard number or licence "
            "number require cross-checking with the packaging or listing."
        )
        reasons.append(
            "Partial certification data detected. Both the Indian Standard number (IS:XXXX) and "
            "licence number should be present together on certified products."
        )

    # 7. Prescribe Actionable Recommended Next Steps
    if risk_level == "RED_FLAG_HIGH_DISCREPANCY":
        recommended_steps.extend([
            "Verify product on the BIS Care App using 'Verify Licence Details' to check if the brand holds any valid licence.",
            "Inspect physical product label or packaging to confirm whether the printed text matches the online listing.",
            "If no valid 7-digit licence exists or deceptive marketing persists, file an inquiry or grievance via the official BIS grievance portal."
        ])
    elif risk_level == "AMBER_FLAG_NEEDS_REVIEW":
        recommended_steps.extend([
            "Request full product label photo from the seller to see if the 7-digit CM/L or 8-digit R-number is printed elsewhere.",
            "Search the manufacturer or brand name in Manakonline (Search a Licensee) to verify if an active licence exists.",
            "Verify whether this specific product category falls under mandatory BIS certification in India."
        ])
    elif risk_level == "PLAUSIBLE_FORMAT_UNVERIFIED":
        if cml_7digit_matches:
            for cml in cml_7digit_matches:
                recommended_steps.append(
                    f"Open BIS Care App > 'Verify Licence Details' > enter CM/L '{cml}' to verify status, validity date, and manufacturer name."
                )
        if crs_8digit_matches:
            for crs in crs_8digit_matches:
                recommended_steps.append(
                    f"Check CRS portal (www.crsbis.in) > Search Registration 'R-{crs}' to verify brand, model, and validity."
                )
        recommended_steps.append(
            "Confirm that the product model on packaging precisely matches the scope listed in the official BIS licence."
        )
    else:
        recommended_steps.append(
            "Check whether the product category requires mandatory BIS certification under Quality Control Orders (QCOs)."
        )

    # 8. Genuine Certification Verification Notice
    official_verification = {
        "live_api_status": "OFFICIAL_API_NOT_AVAILABLE",
        "notice": (
            "Official Live Verification API Not Available: The Bureau of Indian Standards "
            "does not provide a public automated programmatic API for third-party licence validation. "
            "Verification must be executed directly through official BIS portals or the BIS Care App."
        ),
        "official_route": (
            "Open the BIS Care App > 'Verify Licence Details' (for CM/L) or 'Verify R-Number' (for CRS), "
            "or query the ManakOnline e-BIS portal (www.manakonline.in)."
        ),
        "format_limitation_warning": (
            "Format plausibility is NOT proof of genuine certification. "
            "A syntactically valid number does not guarantee the licence is active, genuine, or issued for this product."
        )
    }

    return {
        "risk_level": risk_level,
        "risk_label": risk_label,
        "summary": summary,
        "detected_claims": detected_claims,
        "reasons": reasons,
        "evidence": evidence,
        "recommended_steps": recommended_steps,
        "official_verification": official_verification,
        "disclaimer": REGULATORY_DISCLAIMER,
        "official_resources": OFFICIAL_VERIFICATION_RESOURCES
    }
