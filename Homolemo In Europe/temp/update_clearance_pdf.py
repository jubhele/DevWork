from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

out_path = r"c:\DevWork\Homolemo In Europe\docs\H. Shange Clearance.pdf"

c = canvas.Canvas(out_path, pagesize=A4)
width, height = A4

left = 20 * mm
line_h = 5.4 * mm
y = height - 22 * mm

# Header
header_lines = [
    "Balderstone Sports Institute Football (Pty) Ltd",
    "121 Club street, Linksfield, Gauteng, RSA",
    "Postnet Suite 264, Private Bag X26, Sunninghill 2157, Gauteng, RSA",
    "E-mail: info@bsisports.com",
    "Website: www.bsisports.com",
    "Balderstone Sports Institute Football (Pty) Ltd",
    "Registration Number: 2018 / 632027 / 07",
    "Director: M Balderstone",
]

c.setFont("Helvetica", 10)
for line in header_lines:
    c.drawString(left, y, line)
    y -= line_h

y -= 4 * mm
c.setFont("Helvetica", 11)
c.drawString(left, y, "20 July 2026")
y -= 9 * mm

c.setFont("Helvetica-Bold", 11)
c.drawString(left, y, "RE: Confirmation of Clearance")
y -= 8 * mm

c.setFont("Helvetica", 11)
c.drawString(left, y, "Player Name: Homolemo Amunene Shange")
y -= 6 * mm
c.drawString(left, y, "Passport Number: A11383030")
y -= 6 * mm
c.drawString(left, y, "Player Birth Date: 02 June 2008")
y -= 6 * mm
c.drawString(left, y, "MySafa: 07TGW")
y -= 10 * mm

# Body
body_lines = [
    "This is to confirm that Homolemo Amunene Shange, holding passport number A11383030,",
    "has fulfilled all obligations to Balderstone Sports Institute Football Academy and is",
    "free to leave the club. The player has been a free player since 01 July 2026.",
    "",
    "Balderstone Sports Institute Football Academy confirms that it will not request or claim",
    "any training compensation, solidarity payment, or related fee from Amu's new club.",
    "He has fulfilled all his obligations with the club, and we hereby clear him to pursue",
    "his football/soccer growth with any club of his choice.",
    "",
    "We wish him every success in his future endeavours.",
]

for line in body_lines:
    c.drawString(left, y, line)
    y -= line_h

y -= 8 * mm
c.drawString(left, y, "Yours in Football,")
y -= 11 * mm
c.drawString(left, y, "Enziwe Maphosa")
y -= 6 * mm
c.drawString(left, y, "Academy Administrator")
y -= 9 * mm
c.drawString(left, y, "Tel: +27 (0) 011 485 1067 / 011 485 1068")
y -= 6 * mm
c.drawString(left, y, "Cell: +27 (0) 81 041 5266")
y -= 6 * mm
c.drawString(left, y, "E-mail: footballadmin@bsisports.com")
y -= 6 * mm
c.drawString(left, y, "Web: www.bsisports.com")

c.save()
print(out_path)
