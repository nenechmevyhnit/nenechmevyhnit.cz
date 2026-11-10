#!/usr/bin/env bash
# Jednorázově nastaví ochranu větve main a související nastavení repozitáře přes GitHub API.
# Spouštět ve vlastním terminálu:  Git Bash: bash nastroje/nastav-github.sh
# PowerShell (tam je „bash“ z WSL):  & "C:Program FilesGitbinbash.exe" nastroje/nastav-github.sh
# Token se zadává skrytě a nikam se neukládá. Potřebuje fine-grained token účtu nenechmevyhnit,
# omezený jen na repozitář nenechmevyhnit.cz, s oprávněním Administration: Read and write.
set -euo pipefail

REPO="nenechmevyhnit/nenechmevyhnit.cz"
API="https://api.github.com"

read -rsp "Vložte token (nezobrazí se): " TOKEN; echo
[ -n "$TOKEN" ] || { echo "Token je prázdný."; exit 1; }

gh_api() { # metoda cesta [json]
  local vystup kod
  vystup=$(mktemp)
  kod=$(curl -sS -o "$vystup" -w '%{http_code}' -X "$1" "$API$2" \
    -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" ${3:+-H "Content-Type: application/json" --data "$3"})
  cat "$vystup"; rm -f "$vystup"
  [ "${kod:0:1}" = "2" ] || { echo; echo "CHYBA: $1 $2 vrátilo HTTP $kod" >&2; exit 1; }
}

# 1) Pojistka anonymity: token musí patřit projektovému účtu, ne osobnímu.
login=$(gh_api GET /user | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)
if [ "$login" != "nenechmevyhnit" ]; then
  echo "Token patří účtu „$login“, ne „nenechmevyhnit“. Končím, nic jsem nezměnil."; exit 1
fi
echo "Token patří účtu nenechmevyhnit."

# 2) Slučování jen merge commitem (kontrola identity sleduje hlavní linii), mazání větví po sloučení.
gh_api PATCH "/repos/$REPO" '{"allow_merge_commit":true,"allow_squash_merge":false,"allow_rebase_merge":false,"delete_branch_on_merge":true}' > /dev/null
echo "✓ Slučování: jen merge commit, větve se po sloučení mažou."

# 3) Actions: výchozí práva tokenu jen pro čtení, ale smí zakládat pull requesty (týdenní archivace).
gh_api PUT "/repos/$REPO/actions/permissions/workflow" '{"default_workflow_permissions":"read","can_approve_pull_request_reviews":true}' > /dev/null
echo "✓ Actions smí zakládat pull requesty."

# 4) Ruleset pro main (založí jen pokud ještě neexistuje).
if gh_api GET "/repos/$REPO/rulesets" | grep -q '"name": *"main"'; then
  echo "• Ruleset „main“ už existuje, nechávám ho beze změny."
else
  gh_api POST "/repos/$REPO/rulesets" '{
    "name": "main",
    "target": "branch",
    "enforcement": "active",
    "bypass_actors": [],
    "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
    "rules": [
      { "type": "deletion" },
      { "type": "non_fast_forward" },
      { "type": "pull_request", "parameters": {
          "required_approving_review_count": 0,
          "dismiss_stale_reviews_on_push": false,
          "require_code_owner_review": false,
          "require_last_push_approval": false,
          "required_review_thread_resolution": true,
          "allowed_merge_methods": ["merge"] } },
      { "type": "required_status_checks", "parameters": {
          "strict_required_status_checks_policy": true,
          "required_status_checks": [ { "context": "kontrola", "integration_id": 15368 } ] } }
    ]
  }' > /dev/null
  echo "✓ Ruleset „main“ založen (bez smazání, bez force push, jen přes PR, zelená kontrola „kontrola“)."
fi

unset TOKEN
echo "Hotovo. Token teď na GitHubu zrušte (Settings → Developer settings → Personal access tokens)."
