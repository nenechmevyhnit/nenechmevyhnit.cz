# Kontrolní seznam před spuštěním

- [ ] Aspoň 5 ověřených kauz v `obsah/kauzy/` (každý zdroj otevřel a ověřil člověk)
- [ ] Údaje držitele domény skryté ve WHOIS (kontakt bez vyplněné organizace; ověřit na https://rdap.nic.cz/entity/<id kontaktu>)
- [ ] Portrét pečlivě vyříznutý ručně (vlasy), nahradit `public/obrazky/portret.webp`
- [ ] Krátké právní ověření (podobizna, texty kauz)
- [ ] DNS u Webglobe: A záznamy 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; AAAA 2606:50c0:8000::153 až 8003::153; `www` CNAME na `nenechmevyhnit.github.io`
- [ ] GitHub: Settings → Pages → Verified domains → ověřit `nenechmevyhnit.cz` (TXT záznam), Source = GitHub Actions, Custom domain = `nenechmevyhnit.cz`, Enforce HTTPS
- [ ] Proměnná repozitáře `NASAZOVAT=ano`
- [ ] Všechny kontroly v Actions zelené
