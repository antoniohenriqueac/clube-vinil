# Garimpo — Clube de Vinil

Protótipo front-end clicável de um clube de assinatura mensal de **discos de vinil usados** com curadoria personalizada.

> Nome provisório: altere em [`src/brand.ts`](src/brand.ts) para rebatizar o produto inteiro.

## Ideia

Não é uma loja de discos cobrando mensalidade. É uma plataforma de **descoberta e curadoria musical** que usa vinil usado como produto físico.

> “Não competir por quem tem mais discos; competir por quem entende melhor o gosto do cliente.”

- Público: amantes de música (25–40), colecionadores iniciantes e experientes
- Piloto: Belo Horizonte · ~30 assinantes · 90 dias
- Mix de artistas familiares + descobertas, com feedback mensal

### Planos (preços de teste · frete à parte no piloto)

| Plano | Preço | O que inclui |
| --- | --- | --- |
| **Garimpo** (Entrada) | R$ 89,90/mês | 1 disco usado alinhado ao perfil |
| **Garimpo Plus** | R$ 129,90/mês | Curadoria mais específica, maior valor, edições especiais |
| **Garimpo Duplo** | R$ 169,90/mês | 2 discos/mês com curadoria complementar |

## O que este protótipo cobre

1. **Landing** — hero, como funciona, planos, FAQ, CTA para o quiz  
2. **Quiz de onboarding** — perfil musical ao vivo (gêneros, estilos, décadas, energia/batida, acústico↔eletrônico, groove) + plano + checkout **demonstração**  
3. **Área do assinante** — disco do mês, condição, cartão-história, avaliação, histórico, preferências, pausar/cancelar  
4. **Admin/curadoria** — estoque, assinantes, picks do mês **e** “Sugestões para garimpar” (sourcing fora do estoque), lista de garimpo exportável (CSV / WhatsApp), KPIs  
5. **Inteligência musical** — mapa de gosto + catálogo Discogs (token opcional) com fallback para seed local (~400 lançamentos)  
6. **Captação de coleções** — formulário público “Venda sua coleção”, kanban de leads, avaliação de lote, parceiros, flyer/QR  
7. **Assinante vende discos** — troca por crédito na assinatura (ou dinheiro menor), carteira, oferta com regras no Admin

Estado persiste em `localStorage`. Não há backend nem pagamentos reais.

### Catálogo Discogs vs seed

| Modo | Quando | Onde configurar |
| --- | --- | --- |
| **Seed** (padrão no Pages) | Sem token | Automático |
| **Discogs** | Token pessoal | Admin → Config, ou `VITE_DISCOGS_TOKEN` (ver `.env.example`) |

O token **nunca** deve ser commitado (`.env` está no `.gitignore`).

## Stack

- Vite + React + TypeScript
- React Router (`HashRouter`) para deep links no GitHub Pages
- Dados mock em TypeScript/JSON-like modules

## Como rodar

```bash
npm install
npm run dev
```

Abra a URL que o Vite mostrar (com base `/clube-vinil/`, algo como `http://localhost:5173/clube-vinil/`).

```bash
npm run build    # gera dist/
npm run preview  # preview da build
```

## Deploy (GitHub Pages)

Workflow em [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml):

- Dispara em push para `main`
- Build com `base: '/clube-vinil/'`
- Publica o artefato `dist` via Actions

URL prevista: **https://antoniohenriqueac.github.io/clube-vinil/**

### Passo manual (uma vez)

1. Repo → **Settings** → **Pages**
2. **Source**: GitHub Actions
3. Faça merge na `main` (ou rode o workflow manualmente)

## Fluxos para explorar

1. Landing → Quiz (veja o painel **Seu perfil musical** ao vivo) → Checkout demo  
2. Admin → Curadoria → **Sugestões para garimpar** → add lista → CSV/WhatsApp  
3. Admin → Curadoria → aba Estoque → confirmar pick do mês  
4. Admin → Config → (opcional) colar token Discogs  
5. `/venda-sua-colecao` → lead demo → Admin → Captação (kanban + avaliar lote)  
6. `/flyer` para impressão / QR · Admin → Parceiros

## Aviso

Projeto pessoal standalone. Capas de disco são **placeholders CSS/SVG** (sem imagens protegidas). Todos os textos da interface estão em português brasileiro.
