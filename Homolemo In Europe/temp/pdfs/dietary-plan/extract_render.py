from pathlib import Path

import fitz
from pypdf import PdfReader


source = Path(r"C:\DevWork\Homolemo In Europe\docs\my_dietary_plan_ZAR.pdf")
output = Path(r"C:\DevWork\Homolemo In Europe\temp\pdfs\dietary-plan")

reader = PdfReader(source)
text = "\n\n".join(
    f"=== PAGE {number} ===\n{page.extract_text() or ''}"
    for number, page in enumerate(reader.pages, start=1)
)
(output / "plan.txt").write_text(text, encoding="utf-8")

document = fitz.open(source)
for number, page in enumerate(document, start=1):
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    pixmap.save(output / f"page-{number:02d}.png")

print(f"pages={len(reader.pages)}")
print(text)
