#!/usr/bin/env bash
# ============================================================
# SERIAL COMPASS — деплой на GitHub Pages одной командой.
#
# Использование (из папки проекта serial-compass):
#   GITHUB_TOKEN=ghp_xxx ./deploy.sh            # репозиторий serial-compass
#   GITHUB_TOKEN=ghp_xxx ./deploy.sh my-repo    # своё имя репозитория
#
# Токен нужен с правами: Contents: Read and write + Pages: Read and write.
# Создать: https://github.com/settings/personal-access-tokens/new
# (Fine-grained token, Repository access -> ai4194678/serial-compass или All repositories)
# Токен вводится в переменной окружения и НЕ сохраняется в репозитории.
# ============================================================
set -euo pipefail

REPO_NAME="${1:-serial-compass}"
OWNER="ai4194678"
BRANCH="main"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "ОШИБКА: задайте токен:  GITHUB_TOKEN=ghp_xxx ./deploy.sh"
  exit 1
fi

API="https://api.github.com"
AUTH=(-H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json")

echo "→ Проверка токена..."
USER_LOGIN=$(curl -sf "${AUTH[@]}" "$API/user" | python3 -c "import json,sys; print(json.load(sys.stdin)['login'])")
echo "  вы вошли как: $USER_LOGIN"
[ "$USER_LOGIN" = "$OWNER" ] || echo "  внимание: это не аккаунт $OWNER — репозиторий будет создан в $USER_LOGIN"

# 1. создать репозиторий, если его нет
echo "→ Создание репозитория $USER_LOGIN/$REPO_NAME (если не существует)..."
CODE=$(curl -s -o /tmp/repo_resp.json -w "%{http_code}" "${AUTH[@]}" -X POST "$API/user/repos" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"SERIAL COMPASS — интерактивная платформа для поиска сериалов\",\"private\":false}")
if [ "$CODE" = "201" ]; then
  echo "  репозиторий создан"
elif grep -q "already exists" /tmp/repo_resp.json; then
  echo "  репозиторий уже существует"
else
  echo "  ответ GitHub: $(cat /tmp/repo_resp.json)"; exit 1
fi

# 2. инициализация и пуш
if [ ! -d .git ]; then
  git init -b "$BRANCH" >/dev/null
fi
git add -A
git -c user.name="$USER_LOGIN" -c user.email="$USER_LOGIN@users.noreply.github.com" \
    commit -m "SERIAL COMPASS: initial release" --allow-empty >/dev/null
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:$GITHUB_TOKEN@github.com/$USER_LOGIN/$REPO_NAME.git"
echo "→ Пуш..."
git push -u origin "$BRANCH" --force 2>/dev/null

# 3. включить GitHub Pages из ветки main (root)
echo "→ Включение GitHub Pages..."
CODE=$(curl -s -o /tmp/pages_resp.json -w "%{http_code}" "${AUTH[@]}" -X POST \
  "$API/repos/$USER_LOGIN/$REPO_NAME/pages" -d '{"source":{"branch":"'"$BRANCH"'","path":"/"}}')
[ "$CODE" = "201" ] || [ "$CODE" = "409" ] && echo "  Pages включены (или уже были включены)" || { cat /tmp/pages_resp.json; exit 1; }

# убрать токен из конфига, чтобы он не остался в .git/config
git remote set-url origin "https://github.com/$USER_LOGIN/$REPO_NAME.git"

echo ""
echo "ГОТОВО ✅  Через 1–2 минуты сайт будет доступен:"
echo "  https://$USER_LOGIN.github.io/$REPO_NAME/"
echo "  (если Pages ещё поднимается — обновите страницу позже; статус: Settings → Pages)"
