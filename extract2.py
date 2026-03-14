import zipfile
import xml.etree.ElementTree as ET

try:
    with zipfile.ZipFile(r"C:\Users\Oem\Documents\antigravity\scannercv\Scanner_Curriculo_Spec_v2.docx") as docx:
        xml_content = docx.read('word/document.xml')
        tree = ET.XML(xml_content)
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        paragraphs = []
        for paragraph in tree.findall('.//w:p', namespaces):
            texts = [node.text for node in paragraph.findall('.//w:t', namespaces) if node.text]
            if texts:
                paragraphs.append(''.join(texts))

    with open(r"C:\Users\Oem\Documents\antigravity\scannercv\spec_extracted2.txt", "w", encoding="utf-8") as f:
        f.write('\n'.join(paragraphs))
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
