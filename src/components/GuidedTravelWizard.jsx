import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';

const needs = [
  { id: 'hotel', label: 'Ver hotéis', hint: 'Hospedagem com contexto certo', icon: 'Bed' },
  { id: 'flight', label: 'Ver voos', hint: 'Rotas, datas e passageiros', icon: 'Plane' },
  { id: 'plan', label: 'Montar roteiro', hint: 'Dias, ritmo e prioridades', icon: 'Map' },
];

const choices = {
  destination: [
    { value: 'Lisboa', label: 'Lisboa', hint: 'Bairros caminháveis e boa gastronomia', icon: 'MapPin' },
    { value: 'Orlando Disney', label: 'Disney / Orlando', hint: 'Parques, logística e descanso', icon: 'MapPin' },
    { value: 'Paris', label: 'Paris', hint: 'Cultura, hotel bem localizado e atmosfera', icon: 'MapPin' },
  ],
  dates: [
    { value: 'datas flexíveis', label: 'Datas flexíveis', hint: 'Buscar uma janela melhor', icon: 'Calendar' },
    { value: 'mês a definir', label: 'Tenho um mês em mente', hint: 'Você pode escrever o mês depois', icon: 'Calendar' },
    { value: 'datas exatas a informar', label: 'Tenho datas exatas', hint: 'Depois informe ida e volta', icon: 'Calendar' },
  ],
  travelers: [
    { value: 'casal', label: 'Casal', hint: 'Atmosfera, localização e boas reservas', icon: 'Heart' },
    { value: 'família com crianças', label: 'Família com crianças', hint: 'Menos deslocamentos e mais pausas', icon: 'Users' },
    { value: '2 adultos', label: 'Adultos', hint: 'Conforto e praticidade', icon: 'Users' },
  ],
  style: [
    { value: 'hotel boutique romântico', label: 'Boutique romântico', hint: 'Charme, atmosfera e localização', icon: 'Heart' },
    { value: 'conforto para família', label: 'Conforto para família', hint: 'Quartos práticos e baixa fricção', icon: 'Users' },
    { value: 'cultura e gastronomia', label: 'Cultura e gastronomia', hint: 'Experiências memoráveis', icon: 'Sparkles' },
  ],
  budget: [
    { value: 'custo-benefício', label: 'Priorizar custo-benefício', hint: 'Economizar sem perder conforto essencial', icon: 'Coins' },
    { value: 'conforto', label: 'Priorizar conforto', hint: 'Menos atrito e melhor localização', icon: 'Sparkles' },
    { value: 'premium consciente', label: 'Premium consciente', hint: 'Boa experiência sem exageros', icon: 'Award' },
  ],
};

function romanticChoices() {
  return {
    travelers: [
      { value: 'casal', label: 'Casal', hint: 'Atmosfera, privacidade e boas reservas', icon: 'Heart' },
      { value: 'casal em ocasião especial', label: 'Ocasião especial', hint: 'Mais cuidado com charme e experiência', icon: 'Sparkles' },
      { value: '2 adultos', label: 'Dois adultos', hint: 'Conforto sem necessariamente clima romântico', icon: 'Users' },
    ],
    style: [
      { value: 'boutique romântico central', label: 'Charmoso e central', hint: 'Bairros bonitos, bons restaurantes e fácil deslocamento', icon: 'Heart' },
      { value: 'boutique reservado e tranquilo', label: 'Reservado e tranquilo', hint: 'Menos movimento, mais descanso e privacidade', icon: 'Sparkles' },
      { value: 'gastronomia e atmosfera', label: 'Gastronomia e atmosfera', hint: 'Hotel como base para bons jantares e experiências', icon: 'Utensils' },
    ],
    budget: [
      { value: 'premium consciente', label: 'Premium consciente', hint: 'Charme e conforto sem exagerar na diária', icon: 'Award' },
      { value: 'conforto', label: 'Priorizar conforto', hint: 'Melhor quarto, localização e serviço', icon: 'Sparkles' },
      { value: 'custo-benefício', label: 'Custo-benefício elegante', hint: 'Boa base sem abrir mão de atmosfera', icon: 'Coins' },
    ],
  };
}

function familyChoices() {
  return {
    travelers: choices.travelers,
    style: [
      { value: 'conforto para família', label: 'Quartos maiores', hint: 'Mais espaço e rotina mais fácil', icon: 'Users' },
      { value: 'baixa fricção logística', label: 'Menos deslocamento', hint: 'Boa localização para reduzir cansaço', icon: 'MapPin' },
      { value: 'hotel prático com conforto', label: 'Praticidade com conforto', hint: 'Café, serviços e acesso simples', icon: 'Bed' },
    ],
    budget: [
      { value: 'custo-benefício', label: 'Custo-benefício', hint: 'Economizar sem complicar a logística', icon: 'Coins' },
      { value: 'conforto', label: 'Priorizar conforto', hint: 'Menos atrito para todos', icon: 'Sparkles' },
      { value: 'premium consciente', label: 'Premium consciente', hint: 'Subir qualidade onde reduz cansaço', icon: 'Award' },
    ],
  };
}

function disneyChoices() {
  return {
    style: [
      { value: 'perto dos parques', label: 'Perto dos parques', hint: 'Menos deslocamento nos dias intensos', icon: 'MapPin' },
      { value: 'transporte fácil para parques', label: 'Transporte fácil', hint: 'Reduz atrito de ida e volta', icon: 'Plane' },
      { value: 'ritmo com descanso', label: 'Ritmo com descanso', hint: 'Pausas e recuperação entre parques', icon: 'Coffee' },
    ],
    budget: [
      { value: 'custo-benefício com logística boa', label: 'Custo-benefício logístico', hint: 'Economia sem perder tempo em deslocamento', icon: 'Coins' },
      { value: 'conforto para criança pequena', label: 'Conforto para criança', hint: 'Quarto e horários mais fáceis', icon: 'Users' },
      { value: 'premium consciente', label: 'Premium consciente', hint: 'Melhor onde reduz cansaço', icon: 'Award' },
    ],
  };
}

function flightChoices() {
  return {
    style: [
      { value: 'menor duração total', label: 'Menor duração', hint: 'Chegar com menos desgaste', icon: 'Clock' },
      { value: 'menos conexões', label: 'Menos conexões', hint: 'Reduzir risco e fricção', icon: 'Plane' },
      { value: 'horário confortável', label: 'Horário confortável', hint: 'Chegada e saída em horários melhores', icon: 'Sun' },
    ],
    budget: [
      { value: 'melhor preço', label: 'Melhor preço', hint: 'Economizar quando a diferença fizer sentido', icon: 'Coins' },
      { value: 'melhor uso de milhas', label: 'Usar milhas', hint: 'Avaliar pontos sem inventar disponibilidade', icon: 'Award' },
      { value: 'conforto', label: 'Priorizar conforto', hint: 'Menos cansaço e mais previsibilidade', icon: 'Sparkles' },
    ],
  };
}

function planChoices() {
  return {
    dates: [
      { value: '7 dias', label: '7 dias', hint: 'Boa primeira versão para organizar a viagem', icon: 'Calendar' },
      { value: '10 dias', label: '10 dias', hint: 'Mais respiro e menos correria', icon: 'Calendar' },
      { value: 'duração flexível', label: 'Duração flexível', hint: 'Ajustamos pelo destino e orçamento', icon: 'Calendar' },
    ],
  };
}

const loadingSteps = [
  'entendendo seu perfil de viagem',
  'cruzando preferências e contexto',
  'consultando opções reais disponíveis',
  'avaliando custo-benefício',
  'organizando recomendação',
  'preparando resposta final',
];

function inferNeed(kind) {
  if (kind === 'hotel') return 'hotel';
  if (kind === 'voo') return 'flight';
  if (kind === 'roteiro' || kind === 'recomendacao') return 'plan';
  return '';
}

function contextProfile(context = {}) {
  const text = [
    context.travelers,
    context.profile,
    context.style,
    context.tripPurpose,
    context.destination,
    ...(context.priorities || []),
  ].join(' ').toLowerCase();
  if (/disney|orlando|parque/.test(text)) return 'disney';
  if (/família|familia|criança|crianca|filho/.test(text)) return 'family';
  if (/casal|romântico|romantico|marido|esposa|lua de mel|boutique/.test(text)) return 'romantic';
  return 'general';
}

function getContextualChoices(need, context = {}) {
  if (need === 'flight') {
    return {
      destination: choices.destination,
      dates: choices.dates,
      travelers: choices.travelers,
      ...flightChoices(),
    };
  }

  const profile = contextProfile(context);
  const override = profile === 'romantic'
    ? romanticChoices()
    : profile === 'family'
      ? familyChoices()
      : profile === 'disney'
        ? disneyChoices()
        : {};
  return {
    destination: choices.destination,
    dates: need === 'plan' ? planChoices().dates : choices.dates,
    travelers: override.travelers || choices.travelers,
    style: override.style || choices.style,
    budget: override.budget || choices.budget,
  };
}

function getSteps(need, context = {}) {
  const travelerLabel = need === 'flight' ? 'passageiros' : 'viajantes';
  const profile = contextProfile(context);
  const dynamicChoices = getContextualChoices(need, context);
  return [
    { id: 'need', label: 'tipo de necessidade', question: 'Por onde começamos?', options: needs },
    { id: 'destination', label: 'destino', question: 'Qual destino você tem em mente?', options: dynamicChoices.destination },
    { id: 'dates', label: need === 'plan' ? 'duração/datas' : 'datas', question: need === 'plan' ? 'Qual duração ou janela você imagina?' : 'Como estão as datas?', options: dynamicChoices.dates },
    {
      id: 'travelers',
      label: travelerLabel,
      question: need === 'flight' ? 'Quem vai voar?' : profile === 'romantic' ? 'É uma viagem a dois?' : 'Quem vai viajar?',
      options: dynamicChoices.travelers,
    },
    {
      id: 'style',
      label: 'estilo',
      question: need === 'flight'
        ? 'O que importa mais no voo?'
        : profile === 'romantic'
          ? 'Você prefere algo mais charmoso e central, ou mais reservado e tranquilo?'
          : profile === 'family'
            ? 'Para a família, o que reduz mais atrito?'
            : profile === 'disney'
              ? 'Na Disney, qual logística devo priorizar?'
              : 'Qual estilo combina melhor?',
      options: dynamicChoices.style,
    },
    { id: 'budget', label: 'prioridade', question: profile === 'romantic' ? 'Como equilibramos charme e orçamento?' : 'Qual prioridade devo respeitar?', options: dynamicChoices.budget },
    { id: 'confirm', label: 'confirmação', question: 'Posso avançar com esse contexto?', options: [] },
  ];
}

function formatNeed(need) {
  return needs.find((item) => item.id === need)?.label || 'Planejar viagem';
}

function buildFinalMessage(context) {
  const needText = {
    hotel: 'buscar hotéis',
    flight: 'buscar voos',
    plan: 'montar roteiro',
  }[context.need] || 'planejar viagem';

  return [
    `Confirmar fluxo guiado para ${needText}.`,
    `Destino: ${context.destination}.`,
    `Datas: ${context.dates}.`,
    context.need === 'flight' ? `Passageiros: ${context.travelers}.` : `Viajantes: ${context.travelers}.`,
    context.need === 'hotel' ? `Estilo: ${context.style}.` : `Perfil: ${context.style}.`,
    `Orçamento/estilo: ${context.budget}.`,
  ].join(' ');
}

function buildInitialContext(paths, initialNeed) {
  const source = paths?.context || {};
  return {
    need: inferNeed(source.intent) || initialNeed,
    destination: source.destination || '',
    dates: source.dates || '',
    travelers: source.travelers || source.profile || '',
    style: source.style || source.accommodationStyle || '',
    budget: source.budget || '',
    priorities: source.priorities || [],
    tripPurpose: source.tripPurpose || '',
    accommodationStyle: source.accommodationStyle || '',
  };
}

function hasStepValue(context, stepId) {
  if (stepId === 'confirm') return false;
  return Boolean(context[stepId]);
}

function firstOpenStep(steps, context, fromIndex = 0) {
  const index = steps.findIndex((step, stepIndex) => stepIndex >= fromIndex && !hasStepValue(context, step.id));
  return index >= 0 ? index : steps.length - 1;
}

const OptionButton = ({ option, onClick }) => {
  const Ic = Icon[option.icon] || Icon.Sparkles;
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors group">
      <div className="h-7 w-7 rounded-lg bg-ink-100 text-ink-700 flex items-center justify-center shrink-0">
        <Ic size={13}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink-900">{option.label}</div>
        {option.hint && <div className="text-[11.5px] text-ink-500 mt-0.5">{option.hint}</div>}
      </div>
      <Icon.ChevronRight size={13} className="text-ink-400 group-hover:text-ink-900"/>
    </button>
  );
};

const LoadingStatus = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((value) => Math.min(value + 1, loadingSteps.length - 1)), 950);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[12.5px] font-medium text-ink-900">Estou preparando a recomendação</div>
        <div className="text-[11.5px] text-ink-500 mt-0.5">{loadingSteps[idx]}</div>
      </div>
      <div className="space-y-1.5">
        {loadingSteps.map((step, stepIdx) => (
          <div key={step} className="flex items-center gap-2 text-[11.5px] text-ink-600">
            <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
              stepIdx <= idx ? 'bg-ink-900 text-paper' : 'bg-ink-100 text-ink-400'
            }`}>
              {stepIdx < idx ? <Icon.Check size={9}/> : <span className="h-1 w-1 rounded-full bg-current"/>}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GuidedTravelWizard = ({ paths, onComplete, onViewResults }) => {
  const initialNeed = inferNeed(paths?.kind);
  const initialContext = useMemo(() => buildInitialContext(paths, initialNeed), [paths, initialNeed]);
  const [context, setContext] = useState(initialContext);
  const [stepIdx, setStepIdx] = useState(() => firstOpenStep(getSteps(initialContext.need || initialNeed, initialContext), initialContext));
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const steps = useMemo(() => getSteps(context.need || initialNeed, context), [context, initialNeed]);
  const step = steps[stepIdx];
  const progress = Math.round(((stepIdx + 1) / steps.length) * 100);

  const pick = (value) => {
    const next = { ...context, [step.id]: value };
    setContext(next);
    setCustom('');
    setStepIdx((current) => firstOpenStep(getSteps(next.need || initialNeed, next), next, current + 1));
  };

  const submitCustom = () => {
    const value = custom.trim();
    if (!value) return;
    pick(value);
  };

  const confirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await onComplete(buildFinalMessage(context));
      setResult({
        error: Boolean(response?.error),
        kind: response?.kind || null,
        count: response?.count || 0,
        text: response?.text || 'Não consegui acessar dados reais agora. Prefiro não te mostrar informações imprecisas. Tenta novamente daqui a pouquinho.',
      });
    } catch {
      setResult({
        error: true,
        text: 'Não consegui acessar dados reais agora. Prefiro não te mostrar informações imprecisas. Tenta novamente daqui a pouquinho.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="mt-4 bg-white border-half rounded-2xl p-4 shadow-soft fade-up">
        <div className="flex items-start gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
            result.error ? 'bg-coral-50 text-coral-700' : 'bg-sage-50 text-sage-700'
          }`}>
            {result.error ? <Icon.Info size={14}/> : <Icon.Check size={14}/>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-ink-900">
              {result.error ? 'Não consegui concluir agora' : 'Recomendação preparada'}
            </div>
            <div className="text-[13px] text-ink-800 leading-relaxed mt-1">
              {result.text}
            </div>
            {result.kind === 'hotels' && !result.error && (
              <button onClick={() => onViewResults?.('hotels')}
                className="mt-3 h-8 px-3 rounded-full bg-ink-900 text-paper text-[12px] font-medium hover:bg-ink-800 inline-flex items-center gap-1.5">
                Ver hotéis nos cards <Icon.ArrowRight size={11}/>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 bg-white border-half rounded-2xl p-4 shadow-soft">
        <LoadingStatus />
      </div>
    );
  }

  const answered = steps
    .filter((item) => item.id !== 'confirm' && context[item.id])
    .map((item) => ({ ...item, value: context[item.id] }));

  return (
    <div className="mt-4 bg-white border-half rounded-2xl p-3 shadow-soft">
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div>
          <div className="text-[12.5px] font-medium text-ink-900">{step.question}</div>
          <div className="text-[11.5px] text-ink-500 mt-0.5">Etapa {stepIdx + 1} de {steps.length} · {step.label}</div>
        </div>
        <div className="text-[11px] text-ink-500">{progress}%</div>
      </div>

      <div className="h-1 rounded-full bg-ink-100 overflow-hidden mb-3">
        <div className="h-full bg-ink-900 transition-all duration-300" style={{ width: `${progress}%` }}/>
      </div>

      {answered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {answered.map((item) => (
            <button key={item.id}
              onClick={() => setStepIdx(steps.findIndex((stepItem) => stepItem.id === item.id))}
              className="h-7 px-2.5 rounded-full bg-ink-50 text-[11.5px] text-ink-700 hover:bg-ink-100">
              {item.label}: <span className="text-ink-900 font-medium">{item.value}</span>
            </button>
          ))}
        </div>
      )}

      {step.id === 'confirm' ? (
        <div className="space-y-3">
          <div className="bg-ink-50 rounded-xl p-3 text-[12.5px] text-ink-700 leading-relaxed">
            Vou {formatNeed(context.need).toLowerCase()} considerando {context.destination}, {context.dates}, {context.travelers}, {context.style} e prioridade em {context.budget}.
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
              className="h-9 px-3 rounded-full border-half bg-white text-[12.5px] text-ink-700 hover:bg-ink-50">
              Voltar
            </button>
            <button onClick={confirm}
              className="h-9 px-4 rounded-full bg-ink-900 text-paper text-[12.5px] font-medium hover:bg-ink-800 inline-flex items-center gap-1.5">
              Confirmar <Icon.ArrowRight size={12}/>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {(step.options || []).map((option) => (
            <OptionButton key={option.value} option={option} onClick={() => pick(option.value)} />
          ))}

          <div className="bg-paper border-half border-dashed rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Icon.Edit size={13} className="text-ink-500 shrink-0"/>
            <input
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') submitCustom(); }}
              placeholder="Outra opção · escreva com suas palavras…"
              className="flex-1 outline-none text-[13px] bg-transparent placeholder:text-ink-500"/>
            {custom.trim() && (
              <button onClick={submitCustom}
                className="h-7 px-2.5 rounded-md bg-ink-900 text-paper text-[11.5px] font-medium hover:bg-ink-800 inline-flex items-center gap-1">
                Enviar <Icon.ArrowRight size={11}/>
              </button>
            )}
          </div>

          {stepIdx > 0 && (
            <button onClick={() => setStepIdx((current) => Math.max(0, current - 1))}
              className="h-8 px-2.5 rounded-full text-[12px] text-ink-600 hover:bg-ink-50 inline-flex items-center gap-1.5">
              <Icon.ChevronLeft size={12}/> Voltar etapa
            </button>
          )}
        </div>
      )}
    </div>
  );
};
