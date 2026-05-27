# Travel-Concierge-AI

AI travel concierge platform.

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra a URL indicada no terminal, normalmente:

```text
http://127.0.0.1:5173/
```

## Build de produção

Gere a versão de produção:

```bash
npm run build
```

Para visualizar o build localmente:

```bash
npm run preview
```

## Agente Voya com OpenAI

O chat usa o endpoint local `/api/chat`.

Sem `OPENAI_API_KEY`, o agente continua funcionando em modo mockado, usando dados e tools simuladas.

Para testar com OpenAI, crie um arquivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Configure:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

Depois rode:

```bash
npm run dev
```

## Stack

- Vite
- React
- React DOM
- Framer Motion
- Lucide React
- OpenAI SDK
- Tailwind CSS via CDN
