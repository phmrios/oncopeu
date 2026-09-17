#!/bin/bash
# Duplo-clique neste arquivo para:
#   1) regenerar o index.html (build.js)
#   2) comitar todas as mudanças da pasta
#   3) enviar (push) para o GitHub
set -e
cd "$(dirname "$0")"

echo "== Gerando index.html =="
./build.js

echo
echo "== Alterações detectadas =="
git add -A
git status --short

if git diff --cached --quiet; then
  echo
  echo "Nada novo para comitar. Encerrando."
  read -p "Pressione Enter para fechar…" _
  exit 0
fi

echo
read -p "Mensagem do commit [atualizando]: " msg
msg="${msg:-atualizando}"

git commit -m "$msg"

branch="$(git rev-parse --abbrev-ref HEAD)"
echo
echo "== Enviando para origin/$branch =="
git push origin "$branch"

echo
echo "Publicado com sucesso."
read -p "Pressione Enter para fechar…" _
