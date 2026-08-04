"""
SA Government Procurement Taxonomy

Maps UNSPSC codes and MSCM (Municipal Standard Chart of the Main Budget) categories
to human-readable GovTender service domains.
Used by the normaliser to tag tenders and by the matcher to improve scoring.
"""
from __future__ import annotations

# UNSPSC segment codes → GovTender service domain
UNSPSC_TO_DOMAIN: dict[str, str] = {
    "43": "ICT hardware and infrastructure",
    "44": "ICT software and solutions",
    "80": "Management and business consulting",
    "81": "Engineering services",
    "82": "Data analytics and business intelligence",
    "83": "Public utilities and government services",
    "72": "Construction and civil engineering",
    "73": "Industrial plant maintenance",
    "76": "Industrial cleaning and environmental services",
    "77": "Environmental management services",
    "85": "Healthcare and medical services",
    "86": "Education and training services",
    "91": "Audit and financial services",
    "92": "Defence and security services",
    "93": "Law enforcement and public safety",
    "70": "Farming, fishing and forestry",
    "47": "Cleaning equipment and supplies",
    "46": "Security and protection equipment",
}

# MSCM vote numbers → service domain (municipal procurement)
MSCM_TO_DOMAIN: dict[str, str] = {
    "1": "Executive and council",
    "2": "Finance and administration",
    "3": "Planning and development",
    "4": "Health services",
    "5": "Community and social services",
    "6": "Sport and recreation",
    "7": "Public safety",
    "8": "Roads and storm water",
    "9": "Water and sanitation",
    "10": "Electricity",
    "11": "Waste management",
    "12": "Housing",
}

# GovTender service domain → relevant UNSPSC segments (reverse lookup)
DOMAIN_TO_UNSPSC: dict[str, list[str]] = {
    "data engineering": ["44", "82", "80"],
    "business intelligence": ["44", "82", "80"],
    "software development": ["44", "43", "80"],
    "ICT infrastructure": ["43", "44"],
    "security services": ["92", "93", "46"],
    "guarding": ["92", "93"],
    "CCTV access control": ["92", "46"],
    "construction": ["72", "81"],
    "civil engineering": ["72", "81"],
    "consulting": ["80", "81"],
    "financial services": ["91", "80"],
    "cleaning services": ["76", "47"],
    "environmental": ["77", "76"],
    "health": ["85"],
    "education": ["86"],
}


def domain_from_unspsc(code: str) -> str | None:
    """Return the service domain for a UNSPSC code (uses segment prefix — first 2 digits)."""
    if not code:
        return None
    segment = code[:2]
    return UNSPSC_TO_DOMAIN.get(segment)


def unspsc_for_service_line(service_line: str) -> list[str]:
    """Return relevant UNSPSC segments for a subscriber service line (case-insensitive partial match)."""
    sl = service_line.lower()
    for domain, segments in DOMAIN_TO_UNSPSC.items():
        if any(word in sl for word in domain.lower().split()):
            return segments
    return []


def score_taxonomy_overlap(tender_unspsc: str | None, subscriber_service_lines: list[str]) -> int:
    """
    Bonus score (0-20) for UNSPSC taxonomy overlap between tender and subscriber.
    Added to the Haiku AI score for better cold-start matching.
    """
    if not tender_unspsc or not subscriber_service_lines:
        return 0

    tender_segment = tender_unspsc[:2]
    for sl in subscriber_service_lines:
        relevant = unspsc_for_service_line(sl)
        if tender_segment in relevant:
            return 20
    return 0
