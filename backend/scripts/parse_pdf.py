from pypdf import PdfReader

reader = PdfReader("C:/Users/ezeem/Downloads/apiMiCorreo.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n---PAGE---\n"

with open("scripts/apiMiCorreo.txt", "w", encoding="utf-8") as f:
    f.write(text)
