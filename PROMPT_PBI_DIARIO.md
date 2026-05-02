# Prompt para Claude/Cowork — projeto `dv2.api-pbi-esol`

Este prompt **substitui** o `PROMPT_PBI_EQUIPE.md` anterior. Cole TODO o conteúdo abaixo como
mensagem inicial num Claude rodando dentro de `C:\Users\arlei\Apps\dv2.api-pbi-esol`.

---

## Tarefa

Você precisa adicionar uma nova **aba "Equipe & Diário de Obra"** na tela `/pbi` (Editar
Projeto). O dado **NÃO** vai pra Sheets/planilha de Projetos PBI — vai pro **portal vizinho
`portal-avaliacao-esol`** que já tem as tabelas SQL prontas para receber.

A ideia: durante a obra, a equipe pode mudar dia a dia. Cada dia tem uma data específica
(podem ter folgas/dias chuvosos no meio), um veículo usado, e a lista de instaladores que
estavam presentes naquele dia.

## Stack do projeto vizinho

O `portal-avaliacao-esol` é Express + tRPC + Drizzle. Ele já expõe os 3 endpoints tRPC
necessários:

```
trpc.installers.list           → GET    todos instaladores ativos
trpc.vehicles.list             → GET    todos veículos ativos
trpc.obraDiario.get            → GET    diário atual de uma obra
trpc.obraDiario.upsert         → PUT    salva o diário inteiro de uma obra
```

URL base do portal: **`http://localhost:3000/api/trpc`** (em dev) ou **`https://app.grupoesol.com/api/trpc`** (prod).

A API form-pbi (este projeto) **não precisa** persistir nada do diário — a UI só fala
com o portal.

## Implementação — 1 mudança no frontend (apenas)

### Investigue primeiro
1. Veja como a página `/pbi` está estruturada (provavelmente em `app/templates/` ou
   `static/`).
2. Veja como as outras abas (Cliente, Técnico, Pagamento, Conexão, Instalação) estão
   implementadas — siga o mesmo padrão.

### Adicione a aba "Equipe & Diário"

Estrutura:

```
[Editar Projeto P1044]

  [Cliente] [Técnico] [Pagamento] [Conexão] [Instalação] [Equipe & Diário] ← NOVA

  ┌──────────────────────────────────────────────────────────────────────┐
  │ Diário da Obra                                                         │
  │                                                                         │
  │ ┌─ Dia 1 ──────────────────────────────────────────────[ x remover ]┐ │
  │ │ Data: [15/04/2026 📅]      Veículo: [L200 01     ▼]                │ │
  │ │ Instaladores presentes:                                              │ │
  │ │   ☑ Hyan       ☑ Elivelton    ☐ Fábio    ☐ Moisés                  │ │
  │ │   ☐ Gabriel T  ☐ Gabriel M    ☐ Gustavo  ☐ Kauã                    │ │
  │ │   ☐ Gustavo P  ☐ Enderson     ☐ Flávio   ☐ Ley       ☐ Élder       │ │
  │ └────────────────────────────────────────────────────────────────────┘ │
  │                                                                         │
  │ ┌─ Dia 2 ──────────────────────────────────────────────[ x remover ]┐ │
  │ │ ...                                                                  │ │
  │ └────────────────────────────────────────────────────────────────────┘ │
  │                                                                         │
  │ [+ Adicionar dia]                                                       │
  │                                                                         │
  │ Total de dias: 2  •  Distintos instaladores presentes: 3                │
  │                                                                         │
  │                                                  [Salvar Diário]        │
  └──────────────────────────────────────────────────────────────────────┘
```

**Observação:** os instaladores aparecem como **grid de checkboxes** (não mais lista
suspensa). A lista vem do portal via `trpc.installers.list` (só ativos).

O veículo é dropdown com a lista de `trpc.vehicles.list`. Primeiro item: `"-"` (sem
veículo, NULL no backend).

### Fluxo de dados

```
Ao abrir a aba:
  → Chama trpc.installers.list()       (cache, refresca por sessão)
  → Chama trpc.vehicles.list()
  → Chama trpc.obraDiario.get({projectCode: "P1044"})
  → Renderiza os dias (ou aba vazia se nunca foi preenchido)

Ao clicar "Salvar Diário":
  → Monta payload:
      {
        projectCode: "P1044",
        days: [
          { dayNumber: 1, date: "2026-04-15", vehicleId: 1, installerIds: [3, 5], notes: null },
          { dayNumber: 2, date: "2026-04-16", vehicleId: 2, installerIds: [3], notes: null },
        ]
      }
  → trpc.obraDiario.upsert(payload)
  → Substitui completamente o diário daquela obra (DELETE + INSERT atômico no portal).
  → Mostra toast "Diário salvo".
```

### Como chamar tRPC sem importar o cliente

O portal usa **tRPC v11** com batching. Se sua página `/pbi` é HTML/JS puro, você pode
chamar com `fetch` direto. Os endpoints individuais ficam em:

- GET (query):
  `GET /api/trpc/installers.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`

- GET (query com input):
  `GET /api/trpc/obraDiario.get?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22projectCode%22%3A%22P1044%22%7D%7D%7D`

- POST (mutation):
  `POST /api/trpc/obraDiario.upsert?batch=1`
  body:
  ```json
  {"0":{"json":{"projectCode":"P1044","days":[...]}}}
  ```

Resposta sempre vem em `[ { result: { data: { json: ... } } } ]` — extraia `[0].result.data.json`.

Header obrigatório nas requests: `credentials: "include"` (pra enviar cookie quando o
login estiver ativo). Hoje o portal está sem auth, então qualquer chamada autoriza.

### Use o módulo de cliente que melhor se encaixar no seu stack
- HTML/JS puro: monte com `fetch`.
- React: pode usar `@trpc/client` apontando pra URL do portal.
- jQuery / outro: `fetch` ou o equivalente.

## Validação

Depois de implementar, teste o fluxo completo:

1. **Subir o portal vizinho** (Cowork no `portal-avaliacao-esol` deve indicar que está
   rodando em `localhost:3000`).
2. Abrir `/pbi` neste projeto, clicar em editar P1044.
3. Ir na aba "Equipe & Diário".
4. Adicionar 2 dias (datas, veículos, marcar 2-3 instaladores em cada).
5. Salvar.
6. Recarregar a página, voltar pra mesma obra. Os dados devem estar lá.
7. Ir em `localhost:3000/admin/instaladores` no portal vizinho — deve listar os 13
   instaladores. Cadastrar um novo, voltar aqui, conferir que aparece no grid.
8. Mesma coisa em `localhost:3000/admin/veiculos`.

## Observações importantes

- **Sem mudança no backend Python (FastAPI)** desta API. Tudo é frontend desta aba e
  consumo do portal vizinho.
- **Sem mudança na planilha Google Sheets**. O Diário fica 100% no MySQL do portal
  (banco `u155320717_esol_obras`).
- Quando o login do portal for religado (mais pra frente), as chamadas ainda vão
  funcionar — só que retornam 401 sem cookie. Por ora não precisa autenticar.
- Em dev, acerte o CORS se necessário: o portal-esol responde a `app.grupoesol.com`
  e a `localhost:3000` por padrão. Se rodar a UI da `/pbi` em outra porta (ex: 8080),
  podemos precisar ampliar a allowlist no portal — me avise se cair em CORS.

---

Pronto. Quando terminar, me chame que faço a validação cruzada do portal.
