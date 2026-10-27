# Meu Assento — API V5

Arquitetura preparada para remover a interface do Google Apps Script da experiência do usuário.

Fluxo:

GitHub Pages (frontend) → Cloudflare Worker (API/CORS) → Google Apps Script (regras) → Google Sheets.

## Segurança

- O frontend público não conhece o segredo do Apps Script.
- `APPS_SCRIPT_SECRET` deve ser cadastrado como Secret no Cloudflare Worker.
- `APPS_SCRIPT_URL` pode ser cadastrado como variável de ambiente.
- O Worker aceita chamadas do frontend da origem `https://danielnrodrigues-git.github.io`.
- O Apps Script valida o mesmo segredo antes de despachar qualquer método da API.

## Produção

Não alterar `assentos/app/` até a V5 ser homologada.
