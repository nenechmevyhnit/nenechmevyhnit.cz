# Kontrolní seznam před spuštěním

- [ ] Aspoň 5 ověřených kauz v `obsah/kauzy/` (každý zdroj otevřel a ověřil člověk)
- [ ] Údaje držitele domény `posudtesami.cz` skryté ve WHOIS (kontakt bez vyplněné organizace; ověřit na https://rdap.nic.cz/entity/<id kontaktu>)
- [ ] Portrét pečlivě vyříznutý ručně (vlasy), nahradit `public/obrazky/portret.webp`
- [ ] Krátké právní ověření (podobizna, texty kauz)
- [ ] DNS domény `posudtesami.cz` u Webglobe: A záznamy 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; AAAA 2606:50c0:8000::153 až 8003::153; `www` CNAME na `nenechmevyhnit.github.io` (adresa GitHub účtu, s doménou nesouvisí)
- [ ] GitHub: Settings → Pages → Verified domains → ověřit `posudtesami.cz` (TXT záznam), Source = GitHub Actions, Custom domain = `posudtesami.cz`, Enforce HTTPS
- [ ] Kontaktní e-mail s novým názvem místo `nenechmevyhnit@gmail.com` (web, `.github/ISSUE_TEMPLATE/config.yml`)
- [ ] Stará doména `nenechmevyhnit.cz`: přesměrovat na `posudtesami.cz`, nebo nechat propadnout
- [ ] Proměnná repozitáře `NASAZOVAT=ano`
- [ ] Všechny kontroly v Actions zelené
- [x] Ochrana větve `main` a nastavení repozitáře (ruleset, jen merge commity, Actions smí zakládat PR) — `nastroje/nastav-github.sh`, nastaveno 10. 11. 2026
- [x] Přejmenování na *Posuďte sami* a doména `posudtesami.cz` v kódu (13. 11. 2026)
