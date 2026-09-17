#!/bin/bash
# Duplo-clique neste arquivo para regenerar o index.html a partir dos
# arquivos que estão na pasta (roda build.js).
set -e
cd "$(dirname "$0")"

./build.js

echo
read -p "Pronto. Pressione Enter para fechar…" _
