"""Poskládá CSS z odsouhlaseného prototypu (lokální <link> + bloky <style>) v pořadí dokumentu.
Použití: python -I nastroje/vytahni-css.py <prototyp.html> <vystup.css>"""
import re, sys, pathlib

html_cesta, vystup = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
html = html_cesta.read_text(encoding='utf-8')
casti = []
for m in re.finditer(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>|<style>(.*?)</style>', html, re.S):
    if m.group(1):
        href = m.group(1)
        if href.startswith('http'):
            continue
        css = (html_cesta.parent / href).read_text(encoding='utf-8')
        casti.append(f'/* ---- z {href} ---- */\n{css}')
    else:
        casti.append(f'/* ---- vložený <style> ---- */\n{m.group(2)}')
css = '\n'.join(casti)
css = re.sub(r'@import\s+url\([^)]*\)\s*;', '', css)
vystup.write_text('/* Vygenerováno nastroje/vytahni-css.py z ' + html_cesta.name + ' — neupravovat ručně, doplňky patří do upravy.css */\n' + css, encoding='utf-8')
print('zapsáno', vystup)
