import fitz

src = r"c:\DevWork\Homolemo In Europe\docs\_backups\H. Shange Clearance_backup_20260721_123227.pdf"
out = r"c:\DevWork\Homolemo In Europe\docs\H. Shange Clearance.pdf"

doc = fitz.open(src)
page = doc[0]


def replace_line(old_text: str, new_text: str, fontsize: float = 12.0):
    rects = page.search_for(old_text)
    if not rects:
        raise RuntimeError(f"Could not find text: {old_text}")
    r = rects[0]
    page.add_redact_annot(r, fill=(1, 1, 1))
    page.apply_redactions()
    # Baseline just above the original bottom to keep visual alignment.
    page.insert_text((r.x0, r.y1 - 2), new_text, fontname="helv", fontsize=fontsize, color=(0, 0, 0))


# 1) Backdate letter date.
replace_line("20 July 2026", "01 July 2026", fontsize=12.0)

# 2) Replace ID label/number with passport number.
replace_line("ID Number: 0806025201088", "Passport Number: A11383030", fontsize=12.0)

# 3) Add birthdate while preserving line spacing/layout footprint.
replace_line("MySafa: 07TGW", "MySafa: 07TGW    Date of Birth: 02 June 2008", fontsize=12.0)

# 4) Rewrite body paragraph in the same area, preserving the rest of the document.
body_rect = None
for block in page.get_text("blocks"):
    x0, y0, x1, y1, text, *_ = block
    if text.strip().startswith("This is to confirm that Homolemo Amunene Shange"):
        body_rect = fitz.Rect(x0, y0, x1, y1)
        break

if body_rect is None:
    raise RuntimeError("Could not locate body paragraph block")

# Extend to just above the salutation line to preserve layout while giving enough room.
body_rect = fitz.Rect(body_rect.x0, body_rect.y0, body_rect.x1, 398)

page.add_redact_annot(body_rect, fill=(1, 1, 1))
page.apply_redactions()

body_text = (
    "This is to confirm that Homolemo Amunene Shange, holding passport number A11383030, "
    "has fulfilled all obligations to Balderstone Sports Institute Football Academy. "
    "The player has been free to join a new club since 01 July 2026. "
    "Balderstone Sports Institute Football Academy confirms it will not request or claim "
    "any training compensation, solidarity payment, or related fee from Amu's new club. "
    "He is hereby fully cleared to pursue his football/soccer growth with any club of his choice. "
    "We wish him every success in his future endeavours."
)

remaining = page.insert_textbox(
    body_rect,
    body_text,
    fontname="helv",
    fontsize=11.8,
    color=(0, 0, 0),
    align=fitz.TEXT_ALIGN_LEFT,
    lineheight=1.18,
)

if remaining < 0:
    # Retry slightly smaller font if content was clipped.
    page.add_redact_annot(body_rect, fill=(1, 1, 1))
    page.apply_redactions()
    remaining = page.insert_textbox(
        body_rect,
        body_text,
        fontname="helv",
        fontsize=11.0,
        color=(0, 0, 0),
        align=fitz.TEXT_ALIGN_LEFT,
        lineheight=1.15,
    )
    if remaining < 0:
        raise RuntimeError("Body text did not fit in paragraph area")

doc.save(out)
doc.close()
print(out)
