// Mock data for Voya — all in one place so it's easy to swap for an API.

const mockData = {
  user: {
    name: 'Helena Aires',
    handle: '@helena',
    tier: 'Voya Signature',
    miles: 184320,
    cards: 3,
    trips: 4,
  },

  starters: [
    { id: 'disney',  label: 'Disney em família',       hint: '7 dias · novembro',  tone: 'coral' },
    { id: 'europa',  label: 'Europa sem perrengue',    hint: '14 dias · verão',    tone: 'cool' },
    { id: 'lua',     label: 'Lua de mel',              hint: 'romântico · 10 dias', tone: 'warm' },
    { id: 'praia',   label: 'Praia e descanso',        hint: 'caribe · 5 dias',    tone: 'sage' },
    { id: 'japao',   label: 'Japão pela primeira vez', hint: 'cultural · 12 dias', tone: 'ink' },
    { id: 'gastro',  label: 'Gastronomia e cultura',   hint: 'foodie · 8 dias',    tone: 'warm' },
    { id: 'econ',    label: 'Econômico inteligente',   hint: 'milhas · 6 dias',    tone: 'sage' },
  ],

  // Active trip is shown across Plan/Wallet/Trips screens. Helena can have
  // many trips (see `trips`); we render `trip` as her main, live one.
  trip: {
    id: 'trip-lisboa-porto',
    title: 'Portugal — Lisboa & Porto',
    blurb: 'Capitais, vinho do Douro, jantar com vista no Tejo.',
    dates: '12–22 outubro',
    nights: 10,
    travelers: 2,
    budget: 'R$ 24–28k',
    status: 'Roteiro vivo',
    cover: 'warm',
    coverSeed: 'voya-portugal-cover',
    coverLabel: 'Miradouro · Lisboa',
    progress: 68,
    days: [
      {
        d: 1, date: 'Sáb · 12 out', city: 'Lisboa',
        items: [
          { t: 'manhã',  title: 'Check-in Memmo Alfama',    place: 'Alfama',          dur: '45 min', tag: 'hotel', vibe: 'tranquilo', conf: true },
          { t: 'tarde',  title: 'Walking tour com Inês',    place: 'Castelo de S. Jorge', dur: '3 h', tag: 'expert', vibe: 'cultural', conf: true },
          { t: 'noite',  title: 'Jantar no Cantinho do Avillez', place: 'Chiado',      dur: '2 h', tag: 'comida', vibe: 'autoral', conf: false },
        ],
      },
      {
        d: 2, date: 'Dom · 13 out', city: 'Lisboa',
        items: [
          { t: 'manhã',  title: 'Pastel de Belém + Jerónimos', place: 'Belém',        dur: '3 h', tag: 'clássico', vibe: 'turístico', conf: true },
          { t: 'tarde',  title: 'MAAT + Tejo a pé',           place: 'Belém',         dur: '2 h', tag: 'arte', vibe: 'contemplativo', conf: true },
          { t: 'noite',  title: 'Fado no Mesa de Frades',     place: 'Alfama',        dur: '2 h', tag: 'experiência', vibe: 'íntimo', conf: false },
        ],
      },
      {
        d: 3, date: 'Seg · 14 out', city: 'Sintra',
        items: [
          { t: 'manhã',  title: 'Pena + Quinta da Regaleira',  place: 'Sintra',       dur: '5 h', tag: 'day-trip', vibe: 'mágico', conf: true },
          { t: 'tarde',  title: 'Almoço Tascantiga',           place: 'Sintra',       dur: '1 h 30', tag: 'comida', vibe: 'simples', conf: false },
          { t: 'noite',  title: 'Volta para Lisboa · pôr do sol em Adamastor', place: 'Bica', dur: '1 h', tag: 'mirante', vibe: 'romântico', conf: false },
        ],
      },
      {
        d: 4, date: 'Ter · 15 out', city: 'Lisboa → Porto', flight: true,
        items: [
          { t: 'manhã',  title: 'Voo TAP 1922 · LIS → OPO',    place: 'Aeroporto',    dur: '1 h', tag: 'voo', vibe: 'logística', conf: true },
          { t: 'tarde',  title: 'Check-in Torel 1884',         place: 'Aliados',      dur: '30 min', tag: 'hotel', vibe: 'romântico', conf: true },
          { t: 'noite',  title: 'Sunset no Mirador da Vitória', place: 'Vitória',     dur: '2 h', tag: 'mirante', vibe: 'romântico', conf: false },
        ],
      },
      {
        d: 5, date: 'Qua · 16 out', city: 'Vale do Douro',
        items: [
          { t: 'manhã',  title: 'Train scénico Porto → Pinhão', place: 'Douro',       dur: '2 h 30', tag: 'transporte', vibe: 'paisagem', conf: true },
          { t: 'tarde',  title: 'Quinta do Crasto · prova',    place: 'Sabrosa',      dur: '3 h', tag: 'vinho', vibe: 'experiência', conf: true },
          { t: 'noite',  title: 'Jantar Six Senses Douro',     place: 'Lamego',       dur: '3 h', tag: 'comida', vibe: 'autoral', conf: false },
        ],
      },
    ],
    insights: [
      { kind: 'tip',     text: 'Reserva no Mesa de Frades sai 30 dias antes. Posso travar a data por você.' },
      { kind: 'benefit', text: 'Seu Visa Infinite cobre seguro de viagem completo para esta data.' },
      { kind: 'miles',   text: 'Trecho LIS→OPO custa 4.500 milhas TudoAzul (vale a pena vs. R$ 380).' },
    ],
  },

  cards: [
    {
      id: 'voya-signature',
      brand: 'Voya Signature',
      type: 'Premium',
      last4: '4128',
      tone: 'ink',
      perks: ['Salas VIP ilimitadas', 'Seguro viagem premium', 'Concierge 24/7'],
      lounges: 'Priority Pass ilimitado',
      insurance: 'Premium · até US$ 1M',
      best: 'Hotéis e restaurantes premium · 5× pts',
    },
    {
      id: 'azul-infinite',
      brand: 'TAP Miles & Go',
      type: 'Infinite',
      last4: '7702',
      tone: 'cool',
      perks: ['Bagagem extra', '2 entradas Star Alliance Gold/ano', 'Pré-check-in'],
      lounges: '8 acessos/ano · Star Alliance',
      insurance: 'Inclusa Europa',
      best: 'Voos · 3× milhas TAP',
    },
    {
      id: 'caju',
      brand: 'Latam Pass Black',
      type: 'Black',
      last4: '9931',
      tone: 'coral',
      perks: ['Embarque prioritário', '50% bônus Latam Pass', 'Upgrade de cabine'],
      lounges: 'Latam VIP · 4 acessos',
      insurance: 'Bagagem & atraso',
      best: 'Compras internacionais · 4× pts',
    },
  ],

  milesPrograms: [
    { id: 'tudo', name: 'TudoAzul',     points: 86400, expiring: '4.200 em 60d', trend: '+12% este mês', tone: 'cool' },
    { id: 'tap',  name: 'TAP Miles&Go', points: 42100, expiring: '—',           trend: '+5% este mês',  tone: 'coral' },
    { id: 'lp',   name: 'Latam Pass',   points: 55820, expiring: '8.500 em 90d', trend: 'estável',       tone: 'warm' },
    { id: 'sm',   name: 'Smiles',       points: 30410, expiring: '—',           trend: '+2% este mês',  tone: 'sage' },
  ],

  benefits: [
    { id: 'lounge',   icon: 'Users',  title: 'Salas VIP',        desc: 'Priority Pass + acessos por cartão', state: '12 acessos disponíveis' },
    { id: 'seguro',   icon: 'Shield', title: 'Seguro viagem',    desc: 'Cobertura premium · automática',     state: 'Ativo · até 22 out' },
    { id: 'bagagem',  icon: 'Plane',  title: 'Proteção bagagem', desc: 'Indenização rápida em 48 h',         state: 'Coberto · 2 malas' },
    { id: 'cashback', icon: 'Coins',  title: 'Cashback hotel',   desc: '10% em parceiros Voya',              state: 'R$ 880 acumulados' },
    { id: 'transfer', icon: 'Refresh',title: 'Transferência',    desc: '1:2.4 para TudoAzul · até dia 30',   state: 'Bônus ativo' },
    { id: 'conc',     icon: 'Award',  title: 'Concierge 24/7',   desc: 'Reservas, mudanças, emergências',    state: 'Inês está online' },
  ],

  experts: [
    { id: 'ines',    name: 'Inês Marçal',    region: 'Portugal & Espanha',  trips: 142, routes: 18, rating: 4.97, responseMin: 2,  years: 12, tone: 'warm',  specs: ['Vinho','Slow travel','Family'],   regions: ['Europa','Portugal'], bio: 'Nasceu no Porto, vive em Lisboa há 12 anos. Especialista em rotas autorais por Portugal continental e ilhas.', quote: 'Viagem boa é a que te transforma um pouco, sem te exaurir.' },
    { id: 'kenji',   name: 'Kenji Tanaka',  region: 'Japão & Coreia',      trips: 86,  routes: 11, rating: 4.99, responseMin: 3,  years: 9,  tone: 'ink',   specs: ['First timers','Foodie','Ryokans'], regions: ['Japão','Ásia'], bio: 'Ex-jornalista de gastronomia, hoje desenha roteiros entre Tóquio rural e a Coreia do Sul.', quote: 'O segredo do Japão não está em ver tudo, é em sentir um lugar.' },
    { id: 'leila',   name: 'Leila Andrade',  region: 'Caribe & México',     trips: 211, routes: 24, rating: 4.96, responseMin: 4,  years: 20, tone: 'sage',  specs: ['Família','Resort','Eco'],         regions: ['Caribe','Família'], bio: 'Vinte anos desenhando férias com crianças no Caribe sem cair no óbvio.', quote: 'Família não é só Disney. Tem mar, tem floresta, tem cultura.' },
    { id: 'matheus', name: 'Matheus Vidal',  region: 'Itália & Mediterrâneo', trips: 178, routes: 22, rating: 4.98, responseMin: 2, years: 11, tone: 'coral', specs: ['Foodie','Vinho','Lua de mel'],   regions: ['Europa','Itália'], bio: 'Sommelier formado pela Florence Wine Academy, monta viagens autorais pela Itália.', quote: 'O melhor jantar é sempre o segundo, quando o restaurante já te conhece.' },
    { id: 'ayla',    name: 'Ayla Souza',     region: 'África & Oriente Médio', trips: 64, routes: 9, rating: 4.95, responseMin: 5, years: 7,  tone: 'warm', specs: ['Safári','Cultura','Premium'],   regions: ['África','Premium'], bio: 'Especialista em safáris no Quênia e roteiros culturais por Marrocos e Jordânia.', quote: 'Acordar com girafa do lado da varanda muda o que você acha que é luxo.' },
    { id: 'pedro',   name: 'Pedro Cabral',   region: 'Disney & EUA família', trips: 320, routes: 28, rating: 4.94, responseMin: 1, years: 15, tone: 'cool', specs: ['Disney','Família','Cruzeiro'],   regions: ['Disney','Família','EUA'], bio: 'Mais de 60 viagens a Orlando. Sabe o nome do garçom da Cinderella\'s Royal Table.', quote: 'Magic Kingdom às terças é outro parque. Confia.' },
  ],

  routes: [
    { id: 'r1', title: 'Sul da Itália em ritmo lento',         category: 'Gastronomia', days: 12, from: 'R$ 38k', expert: 'Matheus Vidal',  tone: 'coral' },
    { id: 'r2', title: 'Tokyo + Kyoto + Okinawa',             category: 'Japão',        days: 14, from: 'R$ 42k', expert: 'Kenji Tanaka',   tone: 'ink' },
    { id: 'r3', title: 'Caribe sem turistas',                 category: 'Praia',        days: 7,  from: 'R$ 19k', expert: 'Leila Andrade',  tone: 'sage' },
    { id: 'r4', title: 'Walt Disney World — 7 dias família',  category: 'Disney',       days: 7,  from: 'R$ 28k', expert: 'Pedro Cabral',   tone: 'cool' },
    { id: 'r5', title: 'Lua de mel em Santorini & Milos',     category: 'Lua de mel',   days: 10, from: 'R$ 36k', expert: 'Matheus Vidal',  tone: 'warm' },
    { id: 'r6', title: 'Marrakech + deserto do Saara',        category: 'Premium',      days: 8,  from: 'R$ 24k', expert: 'Ayla Souza',     tone: 'warm' },
    { id: 'r7', title: 'Patagônia austral · trekking',        category: 'Aventura',     days: 11, from: 'R$ 21k', expert: 'Inês Marçal',    tone: 'cool' },
    { id: 'r8', title: 'Paris fora do óbvio',                 category: 'Europa',       days: 6,  from: 'R$ 17k', expert: 'Matheus Vidal',  tone: 'coral' },
    { id: 'r9', title: 'Safári Quênia + praia Zanzibar',      category: 'Premium',      days: 12, from: 'R$ 58k', expert: 'Ayla Souza',     tone: 'sage' },
  ],

  flights: [
    { id: 'f1', from: 'GRU', to: 'LIS', dep: '23:40', arr: '13:20+1', airline: 'TAP', flight: 'TP 088', stops: 'Direto', dur: '10h 40', price: 'R$ 4.820', miles: '78.000 TAP', best: 'milhas', tone: 'coral' },
    { id: 'f2', from: 'GRU', to: 'LIS', dep: '22:10', arr: '14:55+1', airline: 'Latam', flight: 'LA 8084', stops: 'Direto', dur: '11h 45', price: 'R$ 5.420', miles: '92.000 LP', best: 'horário', tone: 'cool' },
    { id: 'f3', from: 'GRU', to: 'LIS', dep: '18:50', arr: '15:30+1', airline: 'Iberia', flight: 'IB 6502', stops: '1 conexão MAD', dur: '14h 40', price: 'R$ 3.980', miles: '74.000', best: 'preço', tone: 'sage' },
  ],

  hotels: [
    { id: 'h1', name: 'Memmo Alfama',     city: 'Lisboa', rating: 4.8, nights: 3, price: 'R$ 4.200', perk: 'Café da manhã + upgrade', tone: 'warm', tag: 'Voya Collection' },
    { id: 'h2', name: 'Torel 1884',       city: 'Porto',  rating: 4.9, nights: 3, price: 'R$ 5.100', perk: '€100 crédito SPA',         tone: 'coral', tag: 'Boutique' },
    { id: 'h3', name: 'Six Senses Douro', city: 'Lamego', rating: 4.95, nights: 2, price: 'R$ 8.400', perk: 'Tour vinícola privado',  tone: 'sage', tag: 'Premium' },
    { id: 'h4', name: 'Bairro Alto Hotel', city: 'Lisboa', rating: 4.7, nights: 2, price: 'R$ 3.800', perk: 'Check-out até 16h',       tone: 'cool', tag: 'Editorial' },
  ],

  tours: [
    { id: 't1', name: 'Fado íntimo na Mesa de Frades', city: 'Lisboa', dur: '2 h', price: 'R$ 280', host: 'Inês Marçal', tone: 'coral' },
    { id: 't2', name: 'Prova de Porto Vintage',        city: 'Porto',  dur: '90 min', price: 'R$ 220', host: 'Matheus Vidal', tone: 'warm' },
    { id: 't3', name: 'Walking tour Alfama autoral',   city: 'Lisboa', dur: '3 h', price: 'R$ 180', host: 'Inês Marçal', tone: 'sage' },
    { id: 't4', name: 'Quinta + barco no Douro',       city: 'Douro',  dur: '6 h', price: 'R$ 640', host: 'Inês Marçal', tone: 'cool' },
  ],

  trips: [
    { id: 'p1', title: 'Portugal — Lisboa & Porto',    dates: '12–22 out · 2026', state: 'Roteiro vivo',  travelers: 2, tone: 'warm',  cover: 'Lisboa', progress: 68 },
    { id: 'p2', title: 'Disney em família',            dates: '03–10 nov · 2026', state: 'Em planejamento', travelers: 4, tone: 'cool', cover: 'Orlando', progress: 32 },
    { id: 'p3', title: 'Lua de mel Maldivas',          dates: 'Fev · 2027',       state: 'Idéia',            travelers: 2, tone: 'sage', cover: 'Atol', progress: 12 },
    { id: 'p4', title: 'Japão — Tokyo + Kyoto',        dates: 'Abr · 2026',       state: 'Concluído',        travelers: 2, tone: 'ink',  cover: 'Kyoto', progress: 100 },
  ],

  plans: [
    {
      id: 'curiosa', name: 'Curiosa', price: 'Grátis', tag: 'Comece',
      desc: 'Para descobrir como a Voya pensa.',
      features: ['1 roteiro ativo','Chat com a IA','Wallet básica','Marketplace de experts'],
      cta: 'Continuar grátis', tone: 'paper',
    },
    {
      id: 'viajante', name: 'Viajante', price: 'R$ 49', period: '/mês', tag: 'Mais popular',
      desc: 'Para quem viaja 2–4 vezes por ano com gosto.',
      features: ['Roteiros ilimitados','Concierge IA prioritário','Otimizador de milhas','Calendário sincronizado','Exportação PDF/Calendar'],
      cta: 'Assinar Viajante', tone: 'brand', highlight: true,
    },
    {
      id: 'signature', name: 'Signature', price: 'R$ 199', period: '/mês', tag: 'Premium',
      desc: 'IA + expert humano dedicado em todas as viagens.',
      features: ['Tudo do Viajante','Expert humano dedicado','Reservas premium garantidas','Suporte 24/7 com pessoas','Benefícios exclusivos Voya'],
      cta: 'Falar com a Voya', tone: 'ink',
    },
  ],

  // Live chat seed for the Plan screen
  chatSeed: [
    { who: 'voya',  text: 'Oi Helena. Vi que você curte cidades históricas e gastronomia autoral. Lisboa + Porto encaixa direitinho — quer ver como ficaria 10 dias com Douro no meio?' },
    { who: 'user',  text: 'Sim, queria com bastante respiro e nada de turistão. Pode incluir uma noite em hotel mais boutique.' },
    { who: 'voya',  text: 'Perfeito. Montei um esqueleto com 3 dias Lisboa · 1 day-trip pra Sintra · 4 dias Porto/Douro · 2 dias soltos. Reservei Memmo Alfama e Torel 1884 (boutique).', soft: ['memmo','torel'] },
    { who: 'voya',  text: 'Quer que eu adicione o jantar com Avillez e o fado na Mesa de Frades? São 2 reservas que precisam ser feitas com 30 dias.', cta: ['Adicionar Avillez', 'Sugerir alternativa'] },
  ],

  quickActions: [
    { id: 'date',  label: 'Mudar datas',          icon: 'Calendar' },
    { id: 'bud',   label: 'Ajustar orçamento',    icon: 'Sliders'  },
    { id: 'pace',  label: 'Mais respiro',         icon: 'Coffee'   },
    { id: 'food',  label: 'Mais gastronomia',     icon: 'Utensils' },
    { id: 'kids',  label: 'Adicionar criança',    icon: 'Users'    },
  ],

  // Alternative suggestions used in the EditItemDrawer, keyed by item.tag.
  // Each entry mirrors a timeline item shape so swapping is trivial.
  itemAlternatives: {
    hotel: [
      { title: 'Bairro Alto Hotel',     place: 'Chiado',            dur: '45 min', dur_stay: '3 noites', vibe: 'urbano elegante',  why: 'Vista 360 do telhado, equipe atenciosa', tag: 'hotel', seed: 'voya-h-1' },
      { title: 'Memmo Príncipe Real',   place: 'Príncipe Real',     dur: '45 min', dur_stay: '3 noites', vibe: 'boutique íntimo', why: 'Menor e mais sereno que o Alfama',       tag: 'hotel', seed: 'voya-h-2' },
      { title: 'Santiago de Alfama',    place: 'Alfama',            dur: '45 min', dur_stay: '3 noites', vibe: 'histórico',        why: 'Palacete do séc XV, jantar excelente',   tag: 'hotel', seed: 'voya-h-3' },
      { title: 'The Vintage Lisboa',    place: 'Av. da Liberdade',  dur: '45 min', dur_stay: '3 noites', vibe: 'design hotel',     why: 'Spa premiado, central',                  tag: 'hotel', seed: 'voya-h-4' },
    ],
    comida: [
      { title: 'Belcanto · Avillez',    place: 'Chiado',           dur: '2 h 30', vibe: 'estrelado',        why: '2★ Michelin, signature do chef',   tag: 'comida', seed: 'voya-f-1' },
      { title: 'Tasca da Esquina',      place: 'Campo de Ourique', dur: '1 h 30', vibe: 'tasca refinada',   why: 'Tasca contemporânea, ambiente íntimo', tag: 'comida', seed: 'voya-f-2' },
      { title: 'Pap’Açorda',            place: 'Time Out Market',  dur: '1 h',    vibe: 'clássico',         why: 'Bacalhau à Brás icônico, ágil',    tag: 'comida', seed: 'voya-f-3' },
      { title: 'Prado Restaurante',     place: 'Mercado',          dur: '2 h',    vibe: 'farm-to-table',    why: 'Produtor próprio, vinho natural',  tag: 'comida', seed: 'voya-f-4' },
    ],
    voo: [
      { title: 'TAP TP 088 · noturno',  place: 'GRU → LIS',  dur: '10h 40', vibe: 'direto noturno',    why: 'Chegada de manhã, executiva 3× milhas', tag: 'voo', seed: 'voya-v-1' },
      { title: 'Latam LA 8084',         place: 'GRU → LIS',  dur: '11h 45', vibe: 'direto noturno',    why: 'Conforto Latam, melhor horário',         tag: 'voo', seed: 'voya-v-2' },
      { title: 'Iberia IB 6502',        place: 'GRU → MAD → LIS', dur: '14h 40', vibe: 'com conexão',  why: 'Mais econômica, conexão em Madri',       tag: 'voo', seed: 'voya-v-3' },
    ],
    'day-trip': [
      { title: 'Cascais + Boca do Inferno',    place: 'Cascais',  dur: '4 h',    vibe: 'litoral',          why: 'Tarde tranquila à beira-mar',           tag: 'day-trip', seed: 'voya-d-1' },
      { title: 'Évora + Templo Romano',        place: 'Évora',    dur: '6 h',    vibe: 'histórico',        why: 'Capela dos Ossos, jantar enoturismo',   tag: 'day-trip', seed: 'voya-d-2' },
      { title: 'Mafra + Ericeira',             place: 'Ericeira', dur: '5 h',    vibe: 'surf + palácio',   why: 'Palácio + vila de surf no fim do dia',  tag: 'day-trip', seed: 'voya-d-3' },
    ],
    expert: [
      { title: 'Walking tour com Inês',        place: 'Castelo · Alfama',  dur: '3 h',    vibe: 'cultural',        why: 'Roteiro autoral, paradas em cafés',  tag: 'expert', seed: 'voya-e-1' },
      { title: 'Food tour com Tiago',          place: 'Cais do Sodré',     dur: '3 h 30', vibe: 'gastronômico',    why: 'Mercados + ginjinha + tasca local',  tag: 'expert', seed: 'voya-e-2' },
      { title: 'Vespa tour com Maria',         place: 'Bairro Alto',       dur: '2 h 30', vibe: 'urbano',          why: 'Miradouros que turista não acha',    tag: 'expert', seed: 'voya-e-3' },
    ],
    arte: [
      { title: 'MAAT + Tejo a pé',     place: 'Belém',       dur: '2 h',    vibe: 'contemplativo', why: 'Arquitetura + arte contemporânea',   tag: 'arte', seed: 'voya-a-1' },
      { title: 'Museu Gulbenkian',     place: 'São Sebastião', dur: '2 h 30', vibe: 'erudito',     why: 'Coleção pessoal magnífica, jardim',  tag: 'arte', seed: 'voya-a-2' },
      { title: 'Coleção Berardo',      place: 'CCB · Belém',  dur: '2 h',    vibe: 'moderno',     why: 'Pop art e moderna em um só lugar',   tag: 'arte', seed: 'voya-a-3' },
    ],
    vinho: [
      { title: 'Quinta do Crasto · prova',    place: 'Sabrosa',  dur: '3 h', vibe: 'experiência',  why: 'Pool icônica, prova de Tinta Roriz',  tag: 'vinho', seed: 'voya-w-1' },
      { title: 'Quinta do Vallado',           place: 'Régua',    dur: '2 h 30', vibe: 'design',    why: 'Hotel + adega assinada Frances',      tag: 'vinho', seed: 'voya-w-2' },
      { title: 'Quinta Nova de Nossa Senhora', place: 'Pinhão', dur: '3 h',  vibe: 'histórico',    why: 'Vista do vale, refeição na adega',   tag: 'vinho', seed: 'voya-w-3' },
    ],
    mirante: [
      { title: 'Miradouro da Senhora do Monte', place: 'Graça',   dur: '45 min', vibe: 'pôr do sol', why: 'Sem fila, vista ampla',           tag: 'mirante', seed: 'voya-m-1' },
      { title: 'Park Rooftop Bar',              place: 'Bica',    dur: '1 h 30', vibe: 'cocktail',  why: 'Drink no telhado de garagem',     tag: 'mirante', seed: 'voya-m-2' },
      { title: 'Topo Martim Moniz',             place: 'Mouraria',dur: '1 h 30', vibe: 'jovem',     why: 'Vista do castelo + DJs',          tag: 'mirante', seed: 'voya-m-3' },
    ],
    'experiência': [
      { title: 'Spa premium no Memmo',          place: 'Hotel',   dur: '1 h 30', vibe: 'restaurador', why: 'Tratamento de aromaterapia',     tag: 'experiência', seed: 'voya-x-1' },
      { title: 'Aula de cozinha portuguesa',    place: 'Mercado', dur: '3 h',    vibe: 'hands-on',    why: 'Mercado + cozinhar com chef',    tag: 'experiência', seed: 'voya-x-2' },
      { title: 'Sunset boat no Tejo',           place: 'Doca',    dur: '2 h',    vibe: 'romântico',   why: 'Veleiro pequeno, espumante',     tag: 'experiência', seed: 'voya-x-3' },
    ],
    transporte: [
      { title: 'Train scénico Porto → Pinhão',  place: 'Linha do Douro', dur: '2 h 30', vibe: 'paisagem',  why: 'Margem do rio o caminho todo', tag: 'transporte', seed: 'voya-t-1' },
      { title: 'Carro com motorista',           place: 'porta a porta',  dur: '2 h',    vibe: 'flexível',  why: 'Para no que pedir, ar-cond.',  tag: 'transporte', seed: 'voya-t-2' },
      { title: 'Cruzeiro pelo Douro',           place: 'Pinhão',         dur: '4 h',    vibe: 'lento',     why: 'Almoço a bordo, vistas',      tag: 'transporte', seed: 'voya-t-3' },
    ],
    'clássico': [
      { title: 'Pastel de Belém + Jerónimos',  place: 'Belém',     dur: '3 h',    vibe: 'turístico',     why: 'O óbvio que vale a pena',          tag: 'clássico', seed: 'voya-c-1' },
      { title: 'Tram 28 + Miradouro',          place: 'Graça',     dur: '2 h',    vibe: 'turístico',     why: 'Pegue cedo para sentar',           tag: 'clássico', seed: 'voya-c-2' },
      { title: 'Castelo de São Jorge',         place: 'Alfama',    dur: '2 h',    vibe: 'histórico',     why: 'Reserve hora pra evitar fila',     tag: 'clássico', seed: 'voya-c-3' },
    ],
  },

  // Detailed itineraries shown when "Usar este roteiro" is clicked on an expert's route.
  // Keyed by route id from `routes`.
  // Disney trip — generated by the in-chat wizard. This is what we surface in
  // PlanScreen after the user finishes the 6 single-click questions.
  disneyTrip: {
    id: 'trip-disney',
    title: 'Disney em família · 7 dias',
    blurb: 'Magic Kingdom, Animal Kingdom, EPCOT e Hollywood — com respiro, piscina e jantares em família.',
    dates: '8–15 julho',
    nights: 7,
    travelers: 4,
    budget: 'R$ 48–62k total',
    status: 'Roteiro gerado',
    cover: 'cool',
    coverSeed: 'voya-disney-cover',
    coverLabel: 'Magic Kingdom · Orlando',
    progress: 24,
    expert: 'Pedro Cabral',
    days: [
      { d: 1, date: 'Sex · 8 jul', city: 'GRU → Orlando', flight: true,
        items: [
          { t: 'manhã', title: 'Voo TAP TP 121 · GRU → MCO',  place: 'Aeroporto',    dur: '8 h 45', tag: 'voo',    vibe: 'logística',   conf: true },
          { t: 'tarde', title: 'Check-in Disney Polynesian',   place: 'Resort',       dur: '45 min', tag: 'hotel',  vibe: 'tema família', conf: true },
          { t: 'noite', title: "Jantar 'Ohana com personagens", place: 'Polynesian',   dur: '1 h 30', tag: 'comida', vibe: 'família',     conf: true },
        ],
      },
      { d: 2, date: 'Sáb · 9 jul', city: 'Magic Kingdom',
        items: [
          { t: 'manhã', title: 'Rope drop · Seven Dwarfs Mine', place: 'Fantasyland',  dur: '4 h',    tag: 'clássico',  vibe: 'mágico',  conf: true },
          { t: 'tarde', title: 'Almoço Be Our Guest + Parade', place: 'Beast Castle',  dur: '2 h',    tag: 'comida',    vibe: 'imersivo', conf: true },
          { t: 'noite', title: 'Fogos Happily Ever After',     place: 'Cinderella Castle', dur: '1 h', tag: 'experiência', vibe: 'noite mágica', conf: false },
        ],
      },
      { d: 3, date: 'Dom · 10 jul', city: 'EPCOT',
        items: [
          { t: 'manhã', title: 'Soarin\' + Frozen Ever After', place: 'Future World', dur: '3 h',    tag: 'clássico',  vibe: 'aventura',  conf: true },
          { t: 'tarde', title: 'World Showcase · pavilhões',  place: 'World Showcase', dur: '3 h 30', tag: 'experiência', vibe: 'cultural', conf: false },
          { t: 'noite', title: 'Jantar Le Cellier · Canadá',  place: 'Canadá pavilion', dur: '2 h',   tag: 'comida',    vibe: 'autoral',   conf: true },
        ],
      },
      { d: 4, date: 'Seg · 11 jul', city: 'Dia livre · piscina',
        items: [
          { t: 'manhã', title: 'Piscina + café da manhã lento', place: 'Resort',      dur: '3 h',    tag: 'experiência', vibe: 'respirar', conf: false },
          { t: 'tarde', title: 'Disney Springs · compras',     place: 'Disney Springs', dur: '3 h',  tag: 'clássico',    vibe: 'leve',     conf: false },
          { t: 'noite', title: 'Jantar The Boathouse',         place: 'Disney Springs', dur: '2 h',  tag: 'comida',      vibe: 'à beira-mar', conf: true },
        ],
      },
      { d: 5, date: 'Ter · 12 jul', city: 'Animal Kingdom',
        items: [
          { t: 'manhã', title: 'Avatar Flight of Passage',     place: 'Pandora',       dur: '3 h',    tag: 'clássico',    vibe: 'imersivo', conf: true },
          { t: 'tarde', title: 'Kilimanjaro Safaris',          place: 'Africa land',   dur: '2 h',    tag: 'experiência', vibe: 'safári',   conf: false },
          { t: 'noite', title: 'Tree of Life Awakenings',      place: 'Discovery Is.', dur: '1 h',    tag: 'arte',        vibe: 'lírico',   conf: false },
        ],
      },
      { d: 6, date: 'Qua · 13 jul', city: 'Hollywood Studios',
        items: [
          { t: 'manhã', title: 'Rise of the Resistance',       place: 'Galaxy\'s Edge', dur: '2 h 30', tag: 'clássico',    vibe: 'épico',   conf: true },
          { t: 'tarde', title: 'Almoço Sci-Fi Drive-in',       place: 'Studios',       dur: '1 h 30', tag: 'comida',      vibe: 'temático', conf: true },
          { t: 'noite', title: 'Fantasmic! show',              place: 'Hollywood Hills', dur: '1 h',  tag: 'experiência', vibe: 'final mágico', conf: false },
        ],
      },
      { d: 7, date: 'Qui · 14 jul', city: 'Orlando → GRU', flight: true,
        items: [
          { t: 'manhã', title: 'Café com personagens · Chef Mickey', place: 'Contemporary', dur: '1 h 30', tag: 'comida', vibe: 'despedida', conf: true },
          { t: 'tarde', title: 'Compras Premium Outlets',      place: 'Vineland',     dur: '3 h',    tag: 'experiência', vibe: 'family shopping', conf: false },
          { t: 'noite', title: 'Voo TAP TP 122 · MCO → GRU',   place: 'Aeroporto',    dur: '9 h 15', tag: 'voo',       vibe: 'noite no avião', conf: true },
        ],
      },
    ],
    insights: [
      { kind: 'tip',     text: 'Reservei Lightning Lane Premium para Seven Dwarfs e Rise of the Resistance — economiza ~3 horas de fila por dia.' },
      { kind: 'benefit', text: 'Cartão Voya Signature cobre seguro família + ingresso de parques substituível em caso de chuva.' },
      { kind: 'miles',   text: 'GRU↔MCO custa 110.000 milhas TAP + R$ 540 taxa. Economia de R$ 5.200 vs. pago para 4 pessoas.' },
    ],
  },

  // Wizard the chat fires when user picks Disney. Six single-click questions
  // (no branching, no typing required) — designed to feel like a 30-second flow.
  disneyWizard: [
    {
      id: 'who',
      q: 'Quem vai junto?',
      sub: 'Importante pra calibrar ritmo, hotéis e reservas.',
      options: [
        { id: '2a',    label: '2 adultos',                    hint: 'casal' },
        { id: '2a1c',  label: '2 adultos · 1 criança',        hint: 'família compacta' },
        { id: '2a2c',  label: '2 adultos · 2 crianças',       hint: 'família clássica' },
        { id: 'big',   label: 'Grupo grande · 5+ pessoas',    hint: 'extended family' },
      ],
    },
    {
      id: 'kids',
      q: 'Idade das crianças?',
      sub: 'Define quais parques, quais filas e quais reservas.',
      options: [
        { id: 'baby',  label: 'Bebê · 0–3 anos',     hint: 'piscina + breve' },
        { id: 'small', label: 'Pequenas · 4–7',      hint: 'Fantasyland · personagens' },
        { id: 'mid',   label: 'Médias · 8–12',       hint: 'ritmo intenso · todos parques' },
        { id: 'teen',  label: 'Adolescentes · 13+',  hint: 'Hollywood · Galaxy\'s Edge' },
        { id: 'mix',   label: 'Idades mistas',       hint: 'preciso equilibrar' },
      ],
    },
    {
      id: 'days',
      q: 'Quantos dias?',
      sub: 'Magic Kingdom inteiro pede pelo menos 1 dia só pra ele.',
      options: [
        { id: '5',  label: '5 dias',  hint: 'corrido' },
        { id: '7',  label: '7 dias',  hint: 'ideal com respiro', recommended: true },
        { id: '10', label: '10 dias', hint: 'parques + Universal' },
        { id: '14', label: '14 dias', hint: 'parques + cruzeiro' },
      ],
    },
    {
      id: 'when',
      q: 'Quando vocês querem ir?',
      sub: 'Voya checa preço, clima e calendário de eventos.',
      options: [
        { id: '60',  label: 'Em 30–60 dias',    hint: 'agir rápido' },
        { id: '120', label: 'Em 2–4 meses',     hint: 'ainda tem milha bônus' },
        { id: '240', label: 'Em 6 meses ou +',  hint: 'preço ótimo' },
        { id: 'idk', label: 'Ainda sem data',   hint: 'só pesquisando' },
      ],
    },
    {
      id: 'budget',
      q: 'Orçamento total aproximado?',
      sub: 'Inclui voos, hotel, parques, comida e passeios.',
      options: [
        { id: '20', label: 'até R$ 25k',     hint: 'inteligente' },
        { id: '50', label: 'R$ 25–55k',      hint: 'confortável' },
        { id: '80', label: 'R$ 55–90k',      hint: 'sem economizar' },
        { id: '999', label: 'Sem teto',      hint: 'experiência completa' },
      ],
    },
    {
      id: 'stay',
      q: 'Onde vocês querem ficar?',
      sub: 'Cada opção muda dramaticamente o ritmo e o custo.',
      options: [
        { id: 'in',    label: 'Dentro dos parques',         hint: 'extra magic hours · transporte free', recommended: true },
        { id: 'lux',   label: 'Resort Disney premium',      hint: 'transfer próprio' },
        { id: 'house', label: 'Casa/condomínio com cozinha', hint: 'mais espaço, carro próprio' },
        { id: 'mix',   label: 'Misto · 4n parque + 3n casa', hint: 'melhor dos dois' },
      ],
    },
  ],

  // Generation animation copy. Each step lasts ~10s for a ~60s total.
  // We rotate the playful sub-message every couple seconds within each step.
  genSteps: [
    {
      id: 'pref',
      label: 'Lendo seu perfil de viagem',
      sub: [
        'Cruzando família, ritmo e suas viagens passadas',
        'Confirmando que vocês curtem manhã lenta e jantar com a família junto',
        'Verificando alergias e restrições alimentares',
      ],
    },
    {
      id: 'flights',
      label: 'Buscando voos com milhas',
      sub: [
        'Comparando TAP, Latam, Delta e American',
        'Calculando bônus de milhas Voya 140% para esta semana',
        'Reservando assento contíguo para a família',
      ],
    },
    {
      id: 'hotels',
      label: 'Selecionando hotéis Disney',
      sub: [
        'Disponibilidade Polynesian, Grand Floridian e Contemporary',
        'Conferindo monorail e tempo de deslocamento',
        'Pedindo quarto orientado pra fogos do castelo',
      ],
    },
    {
      id: 'rides',
      label: 'Reservando experiências family-first',
      sub: [
        'Lightning Lane Premium para Seven Dwarfs e Rise of Resistance',
        'Personagens no café da manhã · Chef Mickey',
        'Jantar com personagens na Cinderella\'s Royal Table',
      ],
    },
    {
      id: 'logistics',
      label: 'Otimizando logística entre parques',
      sub: [
        'Ordenando dias de parque por aglomeração prevista',
        'Calculando café da manhã antes do rope drop',
        'Reservando carro para Disney Springs no dia livre',
      ],
    },
    {
      id: 'finalize',
      label: 'Costurando tudo num roteiro vivo',
      sub: [
        'Adicionando insights de cartão e seguros',
        'Marcando Pedro Cabral, seu expert Disney, como concierge',
        'Finalizando · seu roteiro está quase pronto',
      ],
    },
  ],

  // Detailed itineraries shown when "Usar este roteiro" is clicked on an expert's route.
  routeDetails: {
    r1: { // Sul da Itália
      title: 'Sul da Itália em ritmo lento',
      blurb: 'Costa Amalfitana, Puglia e Matera em ritmo de slow travel. Vinho, mar e mesas de fim de tarde.',
      cover: 'route-italy-cover',
      includes: ['Hotéis boutique selecionados','3 jantares signature','Carro com motorista','Aula de massa em Puglia','Suporte 24/7 com a Voya'],
      days: [
        { d: 1, city: 'Nápoles',     theme: 'chegada · pizza fritta',          items: ['Check-in centro histórico','Tour gastronômico noturno','Jantar Da Michele'] },
        { d: 2, city: 'Costa Amalfitana', theme: 'mar + limoncello',           items: ['Driver privado para Positano','Almoço Da Adolfo (boat in)','Aperitivo em Praiano'] },
        { d: 3, city: 'Ravello',     theme: 'jardins e silêncio',              items: ['Villa Cimbrone ao amanhecer','Concerto de câmara','Jantar Caruso'] },
        { d: 4, city: 'Matera',      theme: 'sassi e cinema',                  items: ['Transfer pela costa','Walking tour entre os sassi','Jantar em caverna'] },
        { d: 5, city: 'Alberobello',theme: 'trulli + olivais',                 items: ['Visita a casa-trullo','Aula de orecchiette com Nonna','Tarde livre'] },
        { d: 6, city: 'Polignano',   theme: 'falésias e gelato',               items: ['Banho de mar nas cavernas','Almoço Grotta Palazzese','Volta lenta'] },
      ],
    },
    r2: { // Tokyo + Kyoto + Okinawa
      title: 'Tokyo + Kyoto + Okinawa',
      blurb: 'Capital fervilhante, capital histórica e ilhas tropicais. O Japão em 3 atos.',
      cover: 'route-japan-cover',
      includes: ['Hotéis boutique e ryokan','Pass JR ilimitado','Reserva omakase Tóquio','Tour particular Kyoto','Voo doméstico Okinawa'],
      days: [
        { d: 1, city: 'Tóquio',  theme: 'chegada · Shibuya',          items: ['Check-in Aman','Caminhada Shibuya cruzamento','Jantar Omakase'] },
        { d: 2, city: 'Tóquio',  theme: 'arte + comida',              items: ['Museu teamLab','Almoço Sushi Saito (lista de espera)','Ginza à noite'] },
        { d: 3, city: 'Kyoto',   theme: 'shinkansen + templos',       items: ['Trem-bala','Fushimi Inari ao amanhecer','Jantar kaiseki'] },
        { d: 4, city: 'Kyoto',   theme: 'gueixas e bambus',           items: ['Arashiyama floresta de bambu','Geisha district em Gion','Onsen privado'] },
        { d: 5, city: 'Okinawa', theme: 'voo + praia',                items: ['Voo para Okinawa','Check-in Halekulani','Pôr do sol na praia'] },
        { d: 6, city: 'Okinawa', theme: 'reef + descanso',            items: ['Mergulho com tartarugas','Almoço local','Spa de tarde'] },
      ],
    },
    r3: { // Caribe sem turistas
      title: 'Caribe sem turistas',
      blurb: 'Antígua e Saint Lucia: praias quase privadas, vida noturna mínima, ritmo lento.',
      cover: 'route-caribe-cover',
      includes: ['Resort eco-boutique','Tour de mergulho','Almoço em vila local','Cocktail no pôr do sol','Yoga matinal'],
      days: [
        { d: 1, city: 'Antígua',     theme: 'chegada',           items: ['Check-in','Banho de mar','Jantar à beira-mar'] },
        { d: 2, city: 'Antígua',     theme: 'reef + vila',       items: ['Snorkeling com guia','Almoço vila de pescadores','Hammock'] },
        { d: 3, city: 'Saint Lucia', theme: 'pitões + spa',      items: ['Voo curto','Pitons hike','Spa termal'] },
      ],
    },
    r4: { // Disney
      title: 'Walt Disney World — 7 dias família',
      blurb: 'Mágica sem cair em armadilha. Roteiro otimizado por filhos e nervos de adulto.',
      cover: 'route-disney-cover',
      includes: ['Hotel dentro do parque','Lightning Lane premium','Reservas de jantar','Babá Voya','Transfer privado'],
      days: [
        { d: 1, city: 'Orlando',    theme: 'chegada',          items: ['Check-in resort','Pool day','Jantar Be Our Guest'] },
        { d: 2, city: 'Magic Kingdom', theme: 'clássico',     items: ['Abertura mágica','Lightning Lane premium','Fogos noturnos'] },
        { d: 3, city: 'Epcot',     theme: 'food & wine',       items: ['Café com personagens','World Showcase','Jantar Le Cellier'] },
      ],
    },
    r5: { // Santorini & Milos
      title: 'Lua de mel em Santorini & Milos',
      blurb: 'Caldeira, vinhos e Milos selvagem. Pôr do sol todos os dias, dormir bem.',
      cover: 'route-greece-cover',
      includes: ['Suíte com piscina infinita','Catamarã privado','Jantar em adega','Spa para casais','Voo Atenas → Santorini'],
      days: [
        { d: 1, city: 'Santorini', theme: 'chegada',         items: ['Suíte com vista caldeira','Jantar em Oia','Pôr do sol'] },
        { d: 2, city: 'Santorini', theme: 'vinho + barco',   items: ['Tour de vinhos','Catamarã privado tarde','Jantar a bordo'] },
        { d: 3, city: 'Milos',     theme: 'mar selvagem',    items: ['Ferry rápido','Sarakiniko ao amanhecer','Praia Kleftiko'] },
      ],
    },
    r6: { // Marrakech
      title: 'Marrakech + deserto do Saara',
      blurb: 'Riads, souks e duas noites no deserto sob estrelas.',
      cover: 'route-morocco-cover',
      includes: ['Riad signature','Driver privado','Camp deluxe no Saara','Jantar tradicional','Guia local'],
      days: [
        { d: 1, city: 'Marrakech', theme: 'medina',         items: ['Check-in riad','Souk com guia','Jantar no telhado'] },
        { d: 2, city: 'Marrakech', theme: 'jardins + spa',  items: ['Jardim Majorelle','Hammam tradicional','Jantar com música'] },
        { d: 3, city: 'Saara',     theme: 'deserto',        items: ['Driver para Merzouga','Camelo ao pôr do sol','Noite em camp deluxe'] },
      ],
    },
    r7: { // Patagônia
      title: 'Patagônia austral · trekking',
      blurb: 'Torres del Paine + Glaciar Perito Moreno. Esforço físico, recompensa visual.',
      cover: 'route-patagonia-cover',
      includes: ['Lodge premium','Guia certificado','Equipamento','Transfers','Refeições'],
      days: [
        { d: 1, city: 'Punta Arenas', theme: 'chegada',     items: ['Voo','Transfer Torres','Jantar lodge'] },
        { d: 2, city: 'Torres del Paine', theme: 'mirador',items: ['Mirador Las Torres (W)','Almoço de campo','Lodge ao pôr'] },
        { d: 3, city: 'El Calafate',  theme: 'glaciar',     items: ['Cruz fronteira','Caminhada no Perito Moreno','Cervejaria local'] },
      ],
    },
    r8: { // Paris fora do óbvio
      title: 'Paris fora do óbvio',
      blurb: 'Bairros locais, mercados, jantares em bistrôs autorais. Sem fila.',
      cover: 'route-paris-cover',
      includes: ['Hotel boutique Marais','Walking tour Le Marais','Almoço mercado','Jantar bistronomie','Museu sem fila'],
      days: [
        { d: 1, city: 'Paris', theme: 'Marais',     items: ['Check-in','Walking Marais','Jantar Le Servan'] },
        { d: 2, city: 'Paris', theme: 'mercados',   items: ['Mercado Aligre','Almoço bistrot','Tarde livre'] },
        { d: 3, city: 'Paris', theme: 'arte',       items: ['Museu d\'Orsay sem fila','Café no Quartier Latin','Jantar Septime'] },
      ],
    },
    r9: { // Quênia + Zanzibar
      title: 'Safári Quênia + praia Zanzibar',
      blurb: 'Maasai Mara + Stone Town + praia branca. Aventura e descanso na medida.',
      cover: 'route-kenya-cover',
      includes: ['Lodge dentro do parque','Game drives 2× ao dia','Voo para Zanzibar','Resort à beira-mar','Guia naturalista'],
      days: [
        { d: 1, city: 'Maasai Mara', theme: 'chegada',      items: ['Voo bushplane','Game drive da tarde','Jantar no acampamento'] },
        { d: 2, city: 'Maasai Mara', theme: 'big five',     items: ['Game drive amanhecer','Visita aldeia Masai','Sundowner com girafas'] },
        { d: 3, city: 'Zanzibar',    theme: 'oceano',       items: ['Voo','Check-in praia','Mergulho com golfinhos'] },
      ],
    },
  },
};

window.mockData = mockData;
