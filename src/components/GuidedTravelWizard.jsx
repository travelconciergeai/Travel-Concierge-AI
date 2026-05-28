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

function getSteps(need) {
  const travelerLabel = need === 'flight' ? 'passageiros' : 'viajantes';
  return [
    { id: 'need', label: 'tipo de necessidade', question: 'Por onde começamos?', options: needs },
    { id: 'destination', label: 'destino', question: 'Qual destino você tem em mente?', options: choices.destination },
    { id: 'dates', label: 'datas', question: 'Como estão as datas?', options: choices.dates },
    { id: 'travelers', label: travelerLabel, question: need === 'flight' ? 'Quem vai voar?' : 'Quem vai viajar?', options: choices.travelers },
    { id: 'style', label: 'estilo', question: need === 'flight' ? 'O que importa mais no voo?' : 'Qual estilo combina melhor?', options: choices.style },
    { id: 'budget', label: 'prioridade', question: 'Qual prioridade devo respeitar?', options: choices.budget },
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

export const GuidedTravelWizard = ({ paths, onComplete }) => {
  const initialNeed = inferNeed(paths?.kind);
  const [stepIdx, setStepIdx] = useState(0);
  const [context, setContext] = useState({ need: initialNeed });
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const steps = useMemo(() => getSteps(context.need || initialNeed), [context.need, initialNeed]);
  const step = steps[stepIdx];
  const progress = Math.round(((stepIdx + 1) / steps.length) * 100);

  const pick = (value) => {
    const next = { ...context, [step.id]: value };
    setContext(next);
    setCustom('');
    setStepIdx((current) => Math.min(current + 1, steps.length - 1));
  };

  const submitCustom = () => {
    const value = custom.trim();
    if (!value) return;
    pick(value);
  };

  const confirm = async () => {
    setLoading(true);
    await onComplete(buildFinalMessage(context));
  };

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
