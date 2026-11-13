# Деплой на GitHub — аккаунт ai4194678

В песочнице, где собирался проект, нет ваших учётных данных GitHub, поэтому последний шаг — пуш — делается одной командой у вас локально. Всё подготовлено: проект уже оформлен как git-репозиторий с начальным коммитом.

## Вариант A — автоматически, одной командой (рекомендуется)

1. Скачайте папку `serial-compass` себе.
2. Создайте токен GitHub (один раз):
   - откройте https://github.com/settings/personal-access-tokens/new (Fine-grained token);
   - **Repository access** → «Only select repositories» → создайте (или выберите) `serial-compass`;
   - **Permissions** → Repository permissions: `Contents` = Read and write, `Pages` = Read and write;
   - срок действия — на ваш выбор, после деплоя токен можно отозвать.
3. В папке проекта выполните:

```bash
GITHUB_TOKEN=ghp_ваш_токен ./deploy.sh
```

Скрипт сам: создаст репозиторий `ai4194678/serial-compass` → запушит код → включит GitHub Pages из ветки `main` → уберёт токен из git-конфига. Через 1–2 минуты сайт появится по адресу:

**https://ai4194678.github.io/serial-compass/**

Повторный деплой после правок: снова `GITHUB_TOKEN=… ./deploy.sh` (пуш форсируется, история не ломается). Токен вводится только в переменной окружения и никуда не записывается.

## Вариант B — вручную

```bash
cd serial-compass
git init -b main
git add -A
git commit -m "SERIAL COMPASS: initial release"
# создайте пустой репозиторий serial-compass на https://github.com/new
git remote add origin https://github.com/ai4194678/serial-compass.git
git push -u origin main
```

Затем в репозитории: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.

## Важно для Pages

- Это статический сайт без сборки — никаких настроек фреймворка не нужно.
- Постеры и шрифты подгружаются с внешних CDN — интернет при просмотре нужен.
- Если сайт открылся без стилей — убедитесь, что загружались именно файлы из корня репозитория (`css/style.css`, `js/…`), а не вложенная папка.
