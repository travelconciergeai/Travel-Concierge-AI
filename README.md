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

## API de hotéis

O endpoint local `POST /api/travel/hotels` funciona em modo mockado por padrão e usa a camada `server/services/hotelSearchEngine.js`.

O buscador de hotéis organiza:

- provider adapters em `server/integrations/hotels/providers/`
- normalização em `server/services/hotelNormalizer.js`
- matching com experts em `server/services/hotelExpertMatchService.js`
- ranking consultivo em `server/services/hotelRecommendationService.js`

Mock só é usado quando `HOTEL_PROVIDER=mock` estiver configurado explicitamente. Em providers reais, a Voya não faz fallback para hotéis simulados.

Variáveis preparadas para providers futuros:

```text
HOTEL_PROVIDER=mock
AMADEUS_HOTEL_API_KEY=
EXPEDIA_API_KEY=
BOOKING_AFFILIATE_ID=
RAPIDAPI_KEY=
HOTEL_RAPIDAPI_HOST=booking-com15.p.rapidapi.com
```

Para o fluxo real inicial com Amadeus/genérico:

```text
HOTEL_PROVIDER=amadeus
HOTEL_API_KEY=
HOTEL_API_BASE_URL=
```

Se `HOTEL_PROVIDER` for diferente de `mock` e faltar configuração, o endpoint retorna `Hotel provider não configurado`. Se a API real falhar, retorna `Não foi possível consultar hotéis reais agora`.

O formato normalizado inclui `provider`, `bookingUrl`, `matchedExpertRecommendation`, preços, imagem, rating, reviewCount, latitude, longitude, política de cancelamento e score de confiança. Os adapters de Expedia e RapidAPI Hotels.com ficam disponíveis, mas o provider real recomendado agora é Booking COM.

Para usar Booking COM via RapidAPI:

```text
HOTEL_PROVIDER=booking
RAPIDAPI_KEY=
HOTEL_RAPIDAPI_HOST=booking-com15.p.rapidapi.com
```

O adapter Booking COM usa:

- `GET /api/v1/hotels/searchDestination` para resolver destino
- `GET /api/v1/hotels/searchHotels` para buscar hotéis reais
- `GET /api/v1/hotels/getHotelDetails` para enriquecer detalhes, imagem e localização
- `GET /api/v1/hotels/getRooms` para disponibilidade/quartos e política de preço

Na Vercel, cadastre essas variáveis em Project Settings > Environment Variables e faça um novo deploy:

```text
HOTEL_PROVIDER=booking
RAPIDAPI_KEY=...
HOTEL_RAPIDAPI_HOST=booking-com15.p.rapidapi.com
```

As variáveis antigas abaixo podem ser mantidas apenas para compatibilidade temporária:

```text
HOTEL_API_PROVIDER=
HOTEL_API_KEY=
HOTEL_API_BASE_URL=
```

## API de voos

O endpoint local `POST /api/travel/flights` funciona em modo mockado por padrão e usa a camada `server/services/flightSearchEngine.js`.

O buscador de voos organiza:

- provider adapters em `server/integrations/flights/providers/`
- normalização em `server/services/flightNormalizer.js`
- ranking consultivo em `server/services/flightRecommendationService.js`
- recomendação com preço, milhas, Wallet, conforto, família e risco de conexão

Sem provider real, a Voya retorna voos simulados no formato normalizado.

Para usar Flights Scraper Sky via RapidAPI:

```text
FLIGHT_PROVIDER=rapidapi
RAPIDAPI_KEY=
FLIGHT_RAPIDAPI_HOST=flights-sky.p.rapidapi.com
```

Se a API real falhar ou não retornar opções, a Voya mantém o fallback mockado atual para voos e sinaliza `fallbackFrom`/`fallbackReason` no payload.

O adapter RapidAPI usa:

- `GET /flights/search-roundtrip` quando houver data de volta
- `GET /flights/search-one-way` para busca de ida
- `GET /flights/detail` fica reservado para enriquecimento futuro
- `GET /flights/airports` fica reservado para resolução futura de aeroportos

Variáveis preparadas para outros providers:

```text
FLIGHT_PROVIDER=mock
AMADEUS_FLIGHT_API_KEY=
DUFFEL_API_KEY=
LATAM_API_KEY=
```

Os adapters de Amadeus, Duffel e LATAM estão preparados, mas ainda não conectam APIs reais.

## Conhecimento de experts

A camada `server/services/expertKnowledgeService.js` concentra recomendações mockadas de experts por destino, perfil da viagem, tipo de viajante, ritmo, orçamento, crianças e interesses.

Por enquanto, os experts são simulados. A função `getExpertRecommendations(tripContext)` retorna insights estruturados com:

```text
expertName
destination
category
insight
reason
applicableTo
confidence
tags
```

No futuro, essa camada deve ser substituída ou alimentada por transcrições, embeddings e RAG/vector database. Ela deve continuar isolada no servidor e não deve ficar acoplada ao front.

## Stack

- Vite
- React
- React DOM
- Framer Motion
- Lucide React
- OpenAI SDK
- Tailwind CSS via CDN
