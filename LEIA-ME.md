# Plataforma de sedes — projeto pronto

Todos os patches já estão aplicados. Falta só:

1. **Copiar suas imagens** para `images/` (as mesmas de antes: logo-unifesp.png, logo-ada.png, icone.png, poster-stem.png, AdaLovelace.jpeg, MarieCurie.png etc.).
2. **Ligar o backend**
   - Crie uma planilha no Google Sheets → Extensões → Apps Script → cole `apps-script/Code.gs`.
   - Em `CFG.URL_SITE` ponha o endereço do site (com `/` no fim).
   - Implantar → App da Web (executar como você, acesso: qualquer pessoa) → copie a URL `/exec`.
   - Cole essa URL em `apiUrl` no `components/plataforma.js`.
3. **Subir na Vercel** (o `vercel.json` já cria o endereço `/s/<slug>`).

Sem o passo 2 o site roda em modo local, lendo `sedes/*.json`. Para testar: `npx serve` na pasta (não funciona abrindo o arquivo direto).

## Estrutura
```
index.html            hub (lista as sedes)
criar-sede.html       formulário de nova sede
padrao.css  vercel.json
components/           boot.js, plataforma.js/.css, criar-sede.js + componentes de sempre
sede/                 index, quem-somos, mulheres-na-stem, formulario (modelo único)
sedes/                index.json (lista do hub no modo local) e <slug>.json
apps-script/Code.gs   backend (não sobe para o site)
images/               suas imagens
```

## Controle (aba "Sedes" da planilha)
- `status`: pendente | publicado | oculto
- `listar`: sim | nao (aparece no hub)
- `linkHub`: sim | nao (a sede mostra link para o hub; padrão nao)

## Conferir
- A data do evento: o config.js antigo dizia 3 de outubro e o HTML 7 de novembro; `sedes/unifesp-sjc.json` usa **7 de novembro**.
- Nomes de arquivos em minúsculas (a Vercel diferencia maiúsculas).
- Contas Gmail comuns enviam ~100 e-mails/dia.
