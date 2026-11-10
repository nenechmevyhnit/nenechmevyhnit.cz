#!/usr/bin/env bash
# Selže, pokud má některý commit v rozsahu autora nebo committera mimo povolené noreply adresy.
# Kontroluje jen hlavní linii (--first-parent): commity přispěvatelů z pull requestů nesou jejich vlastní
# identitu a nejsou chybou. Chrání před omylem správce, který by commitnul s osobní identitou.
# Použití: scripts/over-identitu.sh [rozsah]   (výchozí HEAD = celá historie)
set -euo pipefail
rozsah="${1:-HEAD}"
case "$rozsah" in 0000000*) rozsah="${rozsah#*..}" ;; esac   # první push větve: před = samé nuly
spatne=$(git log --first-parent --format='%ae%n%ce' "$rozsah" | sort -u | grep -v -E '^(354814288\+nenechmevyhnit@users\.noreply\.github\.com|noreply@github\.com)$' || true)
if [ -n "$spatne" ]; then
  echo "Commity obsahují nepovolenou identitu:"; echo "$spatne"; exit 1
fi
echo "Identita commitů v pořádku."
