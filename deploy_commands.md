# Команды для репозитория в /storage/emulated/0/shadow-fight

Выполнять ТОЛЬКО из этой папки:
```bash
cd /storage/emulated/0/shadow-fight
```

## 1. Настройка git
```bash
git config --global --add safe.directory /storage/emulated/0/shadow-fight
git config --local user.email "your_email@example.com"
git config --local user.name "Your Name"
```

## 2. Создать git-репозиторий (если нет)
```bash
git init
git branch -M main
```

## 3. Подключить удалённый репозиторий
```bash
git remote add origin https://github.com/jingleberry/shadow-fight.git
git remote -v
```

## 4. Добавить, закоммитить, запушить
```bash
git add -A
git commit -m "init: Shadow Fight project"
git push -u origin main
```

## 5. Включить GitHub Pages
- Зайти: https://github.com/jingleberry/shadow-fight/settings/pages
- Branch: `main`
- Folder: `/(root)`
- Save

Сайт: https://jingleberry.github.io/shadow-fight/

## Полезные команды
```bash
git status        # статус
git log --oneline # коммиты
git pull origin main # синхронизация с гитхабом
```
