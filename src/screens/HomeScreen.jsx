import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { isRealDataMode } from "../lib/dataMode.js";
import { sendChatMessage } from "../lib/chatClient.js";
import { saveHotelSearchResults } from "../lib/hotelSearchState.js";
import { saveFlightSearchResults } from "../lib/flightSearchState.js";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";
import { GuidedTravelWizard } from "../components/GuidedTravelWizard.jsx";

// Home — conversational landing.
// Two modes:
//   • 'idle': hero with centered chatbar + starters carousel + cards below
//   • 'chat': full chat layout (sidebar still visible) — user/agent messages flow
//             top-to-bottom, chatbar pinned to the BOTTOM and always visible.
//             The Disney wizard renders inline inside agent messages (list of
//             single-click options + "outra opção" free-text field).

const FINAL_ERROR_SOURCES = ['tool-error', 'real-error', 'real-unavailable', 'client-fallback'];

function getLiveHotelSearch(response) {
  const result = response.hotelSearch || response.tools?.buscarHoteis;
  return result?.status === 'live' && result.options?.length ? result : null;
}

const HomeScreen = ({ setRoute, kickoffPlan, setActiveTripId }) => {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState('idle');                    // idle | chat
  const [chat, setChat] = useState([]);                        // [{ id, who, text? wizardStep? answered? generating? }]
  const [wizardStep, setWizardStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState('asking');                // asking | generating | done
  const toast = useToast();
  const scrollerRef = useRef(null);
  const realMode = isRealDataMode();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [chat, thinking]);

  // ---- flow control ----
  const startDisney = (userText) => {
    setMode('chat');
    setChat([
      { id: 'u-0', who: 'user', text: userText },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setChat(c => [
        ...c,
        { id: 'a-intro', who: 'agent', text: 'Disney em família é uma das minhas especialidades. Vou te perguntar 6 coisas rápidas pra calibrar o roteiro — clica numa opção ou descreve com suas palavras se preferir.' },
        { id: 'q-0', who: 'agent', wizardStep: 0 },
      ]);
      setWizardStep(0);
      setPhase('asking');
    }, 700);
  };

  const submit = (text) => {
    const t = (text || input).trim();
    if (!t) return;
    setInput('');

    if (realMode) {
      const nextChat = [...chat, { id: `u-${Date.now()}`, who: 'user', text: t }];
      setMode('chat');
      setChat(nextChat);
      setThinking(true);
      return sendChatMessage({
        message: t,
        messages: nextChat.map(m => ({ role: m.who === 'agent' ? 'assistant' : 'user', content: m.text || '' })),
      }).then((response) => {
        const hotelSearch = getLiveHotelSearch(response);
        if (hotelSearch) {
          saveHotelSearchResults(hotelSearch.options, {
            status: hotelSearch.status,
            query: hotelSearch.query,
          });
        }
        setChat(c => [...c, { id: `a-${Date.now()}`, who: 'agent', text: response.reply, guidedPaths: response.guidedPaths }]);
      }).catch((error) => {
        setChat(c => [...c, { id: `a-${Date.now()}`, who: 'agent', text: `Não consegui consultar dados reais agora: ${error.message}` }]);
      }).finally(() => {
        setThinking(false);
      });
    }

    // From idle: detect Disney → enter chat; else go straight to plan
    if (mode === 'idle') {
      if (t.toLowerCase().includes('disney')) {
        startDisney(t);
      } else {
        setThinking(true);
        setTimeout(() => {
          kickoffPlan && kickoffPlan(t);
          setRoute('plan');
        }, 600);
      }
      return;
    }

    // In chat mode: if currently asking a wizard question, free-text counts as answer
    if (phase === 'asking') {
      answerWizard('custom', t);
    } else {
      // After generation already done — just push as a chat message
      setChat(c => [...c, { who: 'user', text: t }]);
    }
  };

  const completeGuidedFlow = async (txt) => {
    const t = txt.trim();
    const nextChat = [...chat, { id: `u-${Date.now()}`, who: 'user', text: t }];
    const response = await sendChatMessage({
      message: t,
      messages: nextChat.map(m => ({ role: m.who === 'agent' ? 'assistant' : 'user', content: m.text || '' })),
    });
    const hotelSearch = getLiveHotelSearch(response);
    if (hotelSearch) {
      saveHotelSearchResults(hotelSearch.options, {
        status: hotelSearch.status,
        query: hotelSearch.query,
      });
    }
    if (response.tools?.buscarVoos?.options?.length) {
      saveFlightSearchResults(response.tools.buscarVoos.options, { status: response.tools.buscarVoos.status });
    }
    return {
      kind: hotelSearch ? 'hotels' : null,
      count: hotelSearch?.options?.length || 0,
      text: hotelSearch
        ? `${hotelSearch.options.length} hotéis reais foram carregados nos cards de Hotéis. Abra os cards para reservar ou aplicar um hotel ao roteiro.`
        : response.reply || 'Não consegui acessar dados reais agora. Prefiro não te mostrar informações imprecisas. Tenta novamente daqui a pouquinho.',
      error: FINAL_ERROR_SOURCES.includes(response.source),
    };
  };

  const answerWizard = (optId, label) => {
    const step = mockData.disneyWizard[wizardStep];
    setAnswers(a => ({ ...a, [step.id]: { optId, label } }));
    // Lock the current wizard message + append user reply
    setChat(c => [
      ...c.map(m => (m.wizardStep === wizardStep ? { ...m, answered: { optId, label } } : m)),
      { who: 'user', text: label },
    ]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      if (wizardStep < mockData.disneyWizard.length - 1) {
        const next = wizardStep + 1;
        setWizardStep(next);
        setChat(c => [...c, { who: 'agent', wizardStep: next }]);
      } else {
        // Finished — kick off generation
        setPhase('generating');
        setChat(c => [
          ...c,
          { who: 'agent', text: 'Beleza, tenho tudo. Estou montando seu roteiro agora — leva uns 30 segundos.' },
          { who: 'agent', generating: true },
        ]);
      }
    }, 700);
  };

  const onGenerationDone = () => {
    setActiveTripId && setActiveTripId('trip-disney');
    setRoute('plan');
    // reset for next time
    setTimeout(() => {
      setMode('idle');
      setChat([]);
      setWizardStep(0);
      setAnswers({});
      setPhase('asking');
    }, 400);
  };

  const exitChat = () => {
    setMode('idle');
    setChat([]);
    setWizardStep(0);
    setAnswers({});
    setPhase('asking');
  };

  // ---- render ----
  if (mode === 'chat') {
    return (
      <div className="h-screen flex flex-col bg-canvas">
        {/* slim header */}
        <header className="px-10 pt-6 pb-4 flex items-center justify-between gap-4">
          <button onClick={exitChat}
            className="h-9 px-3 rounded-lg text-[12.5px] text-ink-700 hover:bg-ink-100 inline-flex items-center gap-1.5">
            <Icon.ChevronLeft size={14}/> Voltar ao início
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-ink-900 text-paper flex items-center justify-center">
              <Icon.Logo size={12}/>
            </div>
            <div>
              <div className="text-[13px] font-medium text-ink-900 leading-tight">Voya · concierge</div>
              <div className="text-[10.5px] text-ink-500 leading-tight">{realMode ? 'modo real' : 'montando seu roteiro'}</div>
            </div>
          </div>
          <Button size="sm" variant="ghost" icon={Icon.X} onClick={exitChat}>Sair</Button>
        </header>

        {/* chat scroll */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-10">
          <div className="max-w-[780px] mx-auto py-6 space-y-6">
            {chat.map((m, i) => (
              <ChatMsg key={m.id || i} m={m}
                onAnswer={realMode ? undefined : answerWizard}
                onGuided={completeGuidedFlow}
                onViewResults={(route) => setRoute(route)}
                onGenDone={onGenerationDone}/>
            ))}
            {thinking && (
              <div className="flex gap-1 pt-1 pl-1">
                <span className="dot h-1.5 w-1.5 rounded-full bg-ink-400"/>
                <span className="dot h-1.5 w-1.5 rounded-full bg-ink-400"/>
                <span className="dot h-1.5 w-1.5 rounded-full bg-ink-400"/>
              </div>
            )}
          </div>
        </div>

        {/* bottom chatbar — always visible */}
        <div className="px-10 pb-6 pt-3 bg-gradient-to-t from-canvas via-canvas to-canvas/0">
          <div className="max-w-[780px] mx-auto">
            <div className="bg-white border-half rounded-full shadow-card h-[56px] pl-5 pr-[6px] flex items-center gap-2 transition-shadow hover:shadow-lift focus-within:shadow-lift">
              <Icon.Sparkles size={15} className="text-ink-500 shrink-0"/>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={phase === 'generating' ? 'Aguarde a Voya terminar…' : 'Responda ou pergunte qualquer coisa…'}
                disabled={phase === 'generating'}
                className="flex-1 h-full outline-none text-[14px] placeholder:text-ink-400 bg-transparent leading-none disabled:opacity-50"/>
              <button className="h-9 w-9 rounded-full hover:bg-ink-100 text-ink-600 flex items-center justify-center shrink-0" title="Anexar">
                <Icon.Plus size={15}/>
              </button>
              <button onClick={() => submit()} disabled={phase === 'generating'}
                className="h-11 px-5 rounded-full bg-ink-900 text-paper hover:bg-ink-800 transition-colors flex items-center gap-2 text-[13.5px] font-medium shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon.Send size={14}/>
                Enviar
              </button>
            </div>
            <div className="mt-2 text-[11px] text-ink-500 text-center">
              {phase === 'asking'
                ? 'Você pode clicar numa opção acima ou digitar sua própria resposta aqui.'
                : phase === 'generating'
                  ? 'A Voya está finalizando — chat volta em instantes.'
                  : ' '}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== IDLE MODE =====
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-10 pt-8 pb-2 flex items-center justify-end gap-2">
        <Button variant="ghost" icon={Icon.Bell}>Atualizações</Button>
        <Button variant="secondary" icon={Icon.Plus} onClick={() => setRoute('plan')}>Novo roteiro</Button>
      </header>

      <section className="px-10 pt-2 pb-10">
        <div className="max-w-[860px] mx-auto text-center">
          <Tag tone="brand" className="mx-auto"><Icon.Sparkles size={12}/> Concierge premium · IA + experts reais</Tag>
          <h2 className="mt-5 text-[52px] leading-[1.04] tracking-[-0.025em] font-medium text-ink-900">
            {realMode ? 'Olá.' : 'Olá, Helena!'}
            <br/>
            <span className="serif-i">{realMode ? 'Como posso ajudar sua viagem?' : 'Qual será a sua próxima viagem?'}</span>
          </h2>

          <div className="mt-9 mx-auto max-w-[720px]">
            <div className="bg-white border-half rounded-full shadow-card h-[60px] pl-5 pr-[6px] flex items-center gap-3 transition-shadow hover:shadow-lift focus-within:shadow-lift">
              <Icon.Sparkles size={16} className="text-ink-500 shrink-0"/>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Quer viajar? A Voya tem um roteiro para você."
                className="flex-1 h-full outline-none text-[15px] placeholder:text-ink-400 bg-transparent leading-none"/>
              <button className="h-10 w-10 rounded-full hover:bg-ink-100 text-ink-600 flex items-center justify-center shrink-0" title="Voz">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
                </svg>
              </button>
              <button onClick={() => submit()}
                className="h-12 px-5 rounded-full bg-ink-900 text-paper hover:bg-ink-800 transition-colors flex items-center gap-2 text-[14px] font-medium shrink-0">
                <Icon.Send size={15}/>
                {thinking ? 'Pensando…' : 'Pedir'}
              </button>
            </div>
            <div className="mt-3 text-[12px] text-ink-500 flex items-center gap-2 justify-center">
              <Icon.Lock size={11}/> A Voya nunca compartilha o que você está planejando.
            </div>
          </div>
        </div>
      </section>

      {realMode ? (
        <section className="px-10 pb-12 grid grid-cols-[1.4fr_1fr] gap-6">
          <Card className="p-6">
            <div className="label">Modo real</div>
            <div className="text-[17px] font-medium tracking-tight text-ink-900 mt-1">Nenhuma viagem real carregada ainda.</div>
            <div className="text-[12.5px] text-ink-500 mt-1">Hotéis e voos aparecerão depois de consultas reais aos providers configurados.</div>
          </Card>
          <Card className="p-6">
            <div className="label">Sua Voya hoje</div>
            <div className="text-[17px] font-medium tracking-tight text-ink-900 mt-1">Aguardando dados reais</div>
            <div className="text-[12.5px] text-ink-500 mt-1">Sem cards demonstrativos, saldos simulados ou viagens fictícias.</div>
          </Card>
        </section>
      ) : (
        <>
      <StartersBoard onPick={(label) => submit(label)}/>

      <section className="px-10 pb-12 grid grid-cols-[1.4fr_1fr] gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label">Continuar onde parou</div>
              <div className="text-[17px] font-medium tracking-tight text-ink-900 mt-1">{mockData.trip.title}</div>
              <div className="text-[12.5px] text-ink-500 mt-0.5">{mockData.trip.dates} · {mockData.trip.travelers} viajantes</div>
            </div>
            <div className="flex items-center gap-2">
              <OptimizeMenu onApply={(m) => { toast({title:`Otimizando · ${m.label}`, desc: m.delta || 'Aplicando…', tone:'success'}); setTimeout(() => setRoute('plan'), 500); }}/>
              <Button variant="secondary" iconRight={Icon.ArrowRight} onClick={() => setRoute('plan')}>Abrir</Button>
            </div>
          </div>

          <SmartImg seed={mockData.trip.coverSeed} tone={mockData.trip.cover} label={mockData.trip.coverLabel} w={800} h={420} className="h-[180px] rounded-xl"/>

          <div className="mt-5 grid grid-cols-3 gap-6">
            <Stat label="Progresso" value="68%" hint="3 reservas pendentes"/>
            <Stat label="Estimativa" value={mockData.trip.budget} hint="vs. orçamento" tone="sage"/>
            <Stat label="Milhas otimizadas" value="13.500" hint="economia est. R$ 2.140" tone="sage"/>
          </div>

          <div className="mt-5 flex items-center gap-2 text-[12.5px] text-ink-600">
            <Icon.Sparkles size={14} className="text-ink-900"/>
            <span>Inês (sua expert de Portugal) sugeriu trocar o jantar de domingo. Quer ver?</span>
            <button onClick={() => { setRoute('plan'); toast({title:'Abrindo sugestão da Inês'}); }}
                    className="ml-auto text-ink-900 hover:underline font-medium">Ver</button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label">Sua Voya hoje</div>
              <div className="text-[17px] font-medium tracking-tight text-ink-900 mt-1">Resumo</div>
            </div>
            <Tag tone="brand">ao vivo</Tag>
          </div>
          <div className="space-y-3">
            <Row icon={Icon.Coins} label="Milhas totais" value={mockData.user.miles.toLocaleString('pt-BR')} hint="+12% no mês"/>
            <Row icon={Icon.Wallet} label="Cartões na carteira" value={mockData.user.cards} hint="2 com bônus ativo"/>
            <Row icon={Icon.Calendar} label="Viagens" value={mockData.user.trips} hint="1 em andamento"/>
            <Row icon={Icon.Shield} label="Seguro" value="Ativo" hint="até 22 out · Portugal" tone="sage"/>
          </div>
          <div className="mt-5 pt-5 border-t hairline">
            <div className="label mb-3">Concierge humano</div>
            <div className="flex items-center gap-3">
              <SmartImg seed="expert-ines" tone="warm" w={120} h={120} className="h-10 w-10 rounded-full"/>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink-900">Inês Marçal</div>
                <div className="text-[11.5px] text-ink-500">Online · responde em ~2 min</div>
              </div>
              <Button size="sm" variant="secondary" icon={Icon.Mail}>Falar</Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-10 pb-16">
        <SectionHeader eyebrow="Inspiração editorial" title="Roteiros que combinam com você"
          action={<Button variant="ghost" iconRight={Icon.ArrowRight} onClick={() => setRoute('explore')}>Explorar todos</Button>}/>
        <div className="grid grid-cols-4 gap-4">
          {mockData.routes.slice(0,4).map(r => (
            <button key={r.id} onClick={() => setRoute('explore')}
              className="bg-white border-half rounded-2xl overflow-hidden text-left card-h flex flex-col h-[360px]">
              <SmartImg seed={`route-${r.id}`} tone={r.tone} label={r.category} w={500} h={300} className="h-[170px] w-full shrink-0"/>
              <div className="p-4 flex flex-col flex-1">
                <div className="text-[10.5px] uppercase tracking-wider text-ink-500 mb-1">{r.category}</div>
                <div className="text-[14.5px] font-medium text-ink-900 leading-snug line-clamp-2">{r.title}</div>
                <div className="text-[11.5px] text-ink-500 mt-2 flex items-center gap-1.5">
                  <Icon.Sparkles size={11} className="text-ink-900"/>
                  Por {r.expert}
                </div>
                <div className="mt-auto pt-3 text-[12px] text-ink-500 flex items-center justify-between">
                  <span className="whitespace-nowrap">{r.days} dias</span>
                  <span className="whitespace-nowrap">desde <span className="text-ink-900 font-medium">{r.from}</span></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
};

// ============ Chat message renderer ============
// Switches between user bubbles, plain agent text, inline wizard, and inline gen card.
const ChatMsg = ({ m, onAnswer, onGuided, onViewResults, onGenDone }) => {
  if (m.who === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-ink-900 text-paper rounded-2xl rounded-tr-md px-4 py-2.5 text-[14px] max-w-[80%] leading-relaxed">
          {m.text}
        </div>
      </div>
    );
  }

  // agent message
  if (typeof m.wizardStep === 'number') {
    return (
      <InlineWizard
        stepIdx={m.wizardStep}
        step={mockData.disneyWizard[m.wizardStep]}
        answered={m.answered}
        onPick={(optId, label) => onAnswer(optId, label)}
      />
    );
  }

  if (m.generating) {
    return (
      <div className="fade-up">
        <GeneratingCard
          steps={mockData.genSteps}
          totalDuration={30000}
          onDone={onGenDone}
          onSkip={onGenDone}
          embedded
        />
      </div>
    );
  }

  // plain agent text
  return (
    <div className="max-w-[85%]">
      <div className="text-[14.5px] text-ink-900 leading-relaxed">
        {m.text}
      </div>
      {m.guidedPaths && <GuidedTravelWizard paths={m.guidedPaths} onComplete={onGuided} onViewResults={onViewResults} />}
    </div>
  );
};

// ============ Inline wizard question ============
// Rendered as an agent message inside the chat. Vertical list of options +
// an "Outra opção" free-text input. Collapses once answered.
const InlineWizard = ({ stepIdx, step, answered, onPick }) => {
  const [custom, setCustom] = useState('');
  if (!step) return null;

  if (answered) {
    return (
      <div className="text-[12.5px] text-ink-500 flex items-center gap-2 pl-1">
        <Icon.Check size={12} className="text-ink-900"/>
        <span>{step.q.replace('?','')} → <span className="text-ink-900 font-medium">{answered.label}</span></span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[600px]">
      <div>
        <div className="text-[15.5px] text-ink-900 font-medium leading-snug">{step.q}</div>
        <div className="text-[12.5px] text-ink-500 mt-1">{step.sub}</div>
      </div>

      <ul className="space-y-1.5">
        {step.options.map(o => (
          <li key={o.id}>
            <button onClick={() => onPick(o.id, o.label)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-half hover:border-ink-900 hover:bg-ink-50 transition-colors group">
              <div className="h-6 w-6 rounded-full border-half flex items-center justify-center text-ink-400 group-hover:border-ink-900 group-hover:text-ink-900 transition-colors shrink-0">
                <Icon.ChevronRight size={12}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-ink-900 leading-tight">{o.label}</div>
                <div className="text-[11.5px] text-ink-500 mt-0.5">{o.hint}</div>
              </div>
              {o.recommended && (
                <span className="text-[10px] font-medium px-1.5 h-5 rounded-full bg-ink-900 text-paper flex items-center whitespace-nowrap shrink-0">recomendado</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Outra opção — free text */}
      <div className="bg-paper border-half border-dashed rounded-xl px-4 py-2.5 flex items-center gap-3">
        <Icon.Edit size={13} className="text-ink-500 shrink-0"/>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { onPick('custom', custom.trim()); setCustom(''); } }}
          placeholder="Outra opção · descreva com suas palavras…"
          className="flex-1 outline-none text-[13px] bg-transparent placeholder:text-ink-500"/>
        {custom.trim() && (
          <button onClick={() => { onPick('custom', custom.trim()); setCustom(''); }}
            className="h-7 px-2.5 rounded-md bg-ink-900 text-paper text-[11.5px] font-medium hover:bg-ink-800 transition-colors inline-flex items-center gap-1">
            Enviar <Icon.ArrowRight size={11}/>
          </button>
        )}
      </div>

      <div className="text-[10.5px] mono uppercase tracking-wider text-ink-400">
        pergunta {String(stepIdx+1).padStart(2,'0')} de {String(mockData.disneyWizard.length).padStart(2,'0')}
      </div>
    </div>
  );
};

// ============ Generating animation ============
// Rendered inline in the chat as an agent message. Shows steps progressing.
const GeneratingCard = ({ steps, totalDuration = 30000, onDone, onSkip, embedded = false }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [substepIdx, setSubstepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const stepDuration = totalDuration / steps.length;

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      const newStep = Math.min(steps.length - 1, Math.floor(e / stepDuration));
      setStepIdx(newStep);
      if (e >= totalDuration) {
        clearInterval(tick);
        onDone && onDone();
      }
    }, 200);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    setSubstepIdx(0);
    const subs = steps[stepIdx]?.sub || [''];
    if (subs.length <= 1) return;
    const rot = setInterval(() => {
      setSubstepIdx(i => (i + 1) % subs.length);
    }, 2400);
    return () => clearInterval(rot);
  }, [stepIdx]);

  const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
  const current = steps[stepIdx];
  const sub = (current?.sub || [''])[substepIdx % (current?.sub?.length || 1)];

  return (
    <div className="bg-white border-half rounded-3xl shadow-lift p-6 relative overflow-hidden max-w-[640px]">
      <button onClick={onSkip} title="Ir para o roteiro"
        className="absolute top-4 right-4 h-8 px-3 rounded-md text-[12px] text-ink-500 hover:text-ink-900 hover:bg-ink-100 inline-flex items-center gap-1">
        Ir agora <Icon.ArrowRight size={11}/>
      </button>

      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0">
          <div className="absolute inset-0 rounded-full bg-ink-900 text-paper flex items-center justify-center">
            <Icon.Logo size={20}/>
          </div>
          <div className="absolute inset-0 rounded-full ring-2 ring-ink-900/30 animate-ping"/>
        </div>
        <div className="flex-1 text-left">
          <div className="label">Voya está montando seu roteiro</div>
          <div className="text-[19px] tracking-tight font-medium text-ink-900 mt-1">{current?.label}</div>
          <div className="text-[12.5px] text-ink-500 mt-1 transition-opacity duration-300" key={sub}>
            <span className="shimmer-text">{sub}</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-1 rounded-full bg-ink-100 overflow-hidden">
          <div className="h-full bg-ink-900 transition-all duration-200" style={{ width: `${pct}%` }}/>
        </div>
        <div className="flex items-center justify-between text-[11px] mono text-ink-500 mt-1.5">
          <span>{pct}%</span>
          <span>{Math.max(0, Math.ceil((totalDuration - elapsed) / 1000))}s restantes</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-1.5 text-left">
        {steps.map((s, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={s.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                          ${active ? 'bg-ink-50' : ''}`}>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors
                              ${done ? 'bg-ink-900 text-paper' :
                                active ? 'bg-white border-half text-ink-900' :
                                'bg-ink-100 text-ink-400'}`}>
                {done ? <Icon.Check size={12}/> :
                 active ? <span className="h-1.5 w-1.5 rounded-full bg-ink-900 animate-pulse"/> :
                 <span className="h-1 w-1 rounded-full bg-ink-400"/>}
              </div>
              <div className={`text-[13px] flex-1 transition-colors
                              ${done ? 'text-ink-500 line-through decoration-ink-400' :
                                active ? 'text-ink-900 font-medium' :
                                'text-ink-400'}`}>
                {s.label}
              </div>
              {done && <div className="text-[10.5px] mono text-ink-400">ok</div>}
              {active && <div className="text-[10.5px] mono text-ink-700">…</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Row = ({ icon: Ic, label, value, hint, tone }) => (
  <div className="flex items-center gap-3">
    <div className="h-9 w-9 rounded-lg bg-ink-100 text-ink-700 flex items-center justify-center"><Ic size={15}/></div>
    <div className="flex-1 min-w-0">
      <div className="text-[12px] text-ink-500">{label}</div>
      <div className="text-[14px] font-medium text-ink-900">{value}</div>
    </div>
    <div className={`text-[11.5px] ${tone === 'sage' ? 'text-sage-700' : 'text-ink-500'}`}>{hint}</div>
  </div>
);

// ---------- Starters board: full-width carousel, editable + draggable ----------
const tones = ['warm','cool','sage','coral','ink'];
const StartersBoard = ({ onPick }) => {
  const [items, setItems] = useState(() => mockData.starters.map(s => ({ ...s })));
  const [editing, setEditing] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftHint, setDraftHint] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const scrollerRef = useRef(null);

  const startEdit = (it) => {
    setEditing(it.id);
    setDraftLabel(it.label);
    setDraftHint(it.hint);
  };
  const commitEdit = () => {
    if (!editing) return;
    setItems(xs => xs.map(x => x.id === editing ? { ...x, label: draftLabel || x.label, hint: draftHint || x.hint } : x));
    setEditing(null);
  };
  const remove = (id) => setItems(xs => xs.filter(x => x.id !== id));
  const add = () => {
    const id = 'new-' + Date.now();
    const tone = tones[Math.floor(Math.random() * tones.length)];
    const it = { id, label: 'Nova ideia', hint: 'descrever…', tone };
    setItems(xs => [...xs, it]);
    setTimeout(() => {
      startEdit(it);
      scrollerRef.current?.scrollTo({ left: 999999, behavior: 'smooth' });
    }, 30);
  };

  const onDragStart = (id) => (e) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch {}
  };
  const onDragOver = (id) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== overId) setOverId(id);
  };
  const onDrop = (id) => (e) => {
    e.preventDefault();
    if (!dragId || dragId === id) { setDragId(null); setOverId(null); return; }
    setItems(xs => {
      const a = xs.findIndex(x => x.id === dragId);
      const b = xs.findIndex(x => x.id === id);
      if (a < 0 || b < 0) return xs;
      const copy = xs.slice();
      const [moved] = copy.splice(a, 1);
      copy.splice(b, 0, moved);
      return copy;
    });
    setDragId(null);
    setOverId(null);
  };
  const onDragEnd = () => { setDragId(null); setOverId(null); };

  const scrollBy = (px) => scrollerRef.current?.scrollBy({ left: px, behavior: 'smooth' });

  return (
    <section className="mt-12 px-10 pb-2">
      <div className="flex items-end justify-between mb-5 max-w-[1400px] mx-auto">
        <div>
          <div className="label">Comece por uma ideia</div>
          <div className="text-[22px] tracking-tight font-medium text-ink-900 mt-1.5">Suas pistas favoritas</div>
          <div className="text-[12.5px] text-ink-500 mt-1">Clique para editar · arraste para reordenar · monte como faz sentido pra você</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scrollBy(-340)} title="Anterior"
            className="h-9 w-9 rounded-full border-half bg-white text-ink-700 hover:text-ink-900 hover:bg-ink-100 flex items-center justify-center transition-colors">
            <Icon.ChevronLeft size={15}/>
          </button>
          <button onClick={() => scrollBy(340)} title="Próximo"
            className="h-9 w-9 rounded-full border-half bg-white text-ink-700 hover:text-ink-900 hover:bg-ink-100 flex items-center justify-center transition-colors">
            <Icon.ChevronRight size={15}/>
          </button>
          <button onClick={add}
            className="h-9 px-3 rounded-full border-half bg-white text-[12.5px] font-medium text-ink-900 hover:bg-ink-100 transition-colors inline-flex items-center gap-1.5 ml-1">
            <Icon.Plus size={13}/> Adicionar
          </button>
        </div>
      </div>

      <div className="relative -mx-10">
        <div className="absolute left-0 top-0 bottom-3 w-10 bg-gradient-to-r from-canvas to-transparent pointer-events-none z-10"/>
        <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-canvas to-transparent pointer-events-none z-10"/>
        <div ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-10 px-10 pb-3"
          style={{ scrollbarWidth: 'thin' }}>
          {items.map((s) => {
            const isDragging = dragId === s.id;
            const isOver = overId === s.id && dragId && dragId !== s.id;
            const isEditing = editing === s.id;
            return (
              <div key={s.id}
                draggable={!isEditing}
                onDragStart={onDragStart(s.id)}
                onDragOver={onDragOver(s.id)}
                onDrop={onDrop(s.id)}
                onDragEnd={onDragEnd}
                className={`group relative bg-white border-half rounded-2xl text-left overflow-hidden transition-all shrink-0 snap-start w-[260px]
                            ${isDragging ? 'opacity-40 scale-[.98]' : ''}
                            ${isOver ? 'ring-2 ring-ink-900 ring-offset-2 ring-offset-canvas' : 'hover:border-ink-400 hover:shadow-card'}
                            ${isEditing ? 'shadow-lift ring-1 ring-ink-900' : ''}`}>
                <SmartImg seed={`starter-${s.id}-${s.label.slice(0,10)}`} tone={s.tone} w={500} h={400} className="h-[170px] w-full"/>

                {!isEditing && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onMouseDown={(e)=>e.stopPropagation()} title="Arraste para reordenar"
                      className="h-7 w-7 rounded-md bg-white/95 border-half text-ink-700 hover:text-ink-900 flex items-center justify-center cursor-grab active:cursor-grabbing">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); startEdit(s); }} title="Editar"
                      className="h-7 w-7 rounded-md bg-white/95 border-half text-ink-700 hover:text-ink-900 flex items-center justify-center">
                      <Icon.Edit size={12}/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} title="Remover"
                      className="h-7 w-7 rounded-md bg-white/95 border-half text-ink-700 hover:text-ink-900 flex items-center justify-center">
                      <Icon.Trash size={12}/>
                    </button>
                  </div>
                )}

                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input autoFocus
                        value={draftLabel}
                        onChange={(e) => setDraftLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                        className="w-full h-9 px-2 rounded-md border-half text-[14px] font-medium text-ink-900 bg-white"
                        placeholder="Como você descreveria?"/>
                      <input
                        value={draftHint}
                        onChange={(e) => setDraftHint(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                        className="w-full h-8 px-2 rounded-md border-half text-[12px] text-ink-700 bg-white"
                        placeholder="duração, vibe, ritmo…"/>
                      <div className="flex items-center justify-between pt-1">
                        <button onClick={() => setEditing(null)} className="text-[11.5px] text-ink-500 hover:text-ink-900">Cancelar</button>
                        <button onClick={commitEdit} className="text-[11.5px] font-medium text-ink-900 hover:underline">Salvar ↵</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => onPick(s.label)} className="w-full text-left">
                      <div className="text-[15px] font-medium text-ink-900 leading-tight">{s.label}</div>
                      <div className="text-[12px] text-ink-500 mt-1">{s.hint}</div>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button onClick={add}
            className="border-half border-dashed rounded-2xl text-ink-500 hover:text-ink-900 hover:bg-ink-100/60 transition-colors flex flex-col items-center justify-center gap-2 shrink-0 snap-start w-[260px]">
            <div className="h-10 w-10 rounded-full bg-white border-half flex items-center justify-center"><Icon.Plus size={16}/></div>
            <div className="text-[13px] font-medium">Nova ideia</div>
            <div className="text-[10.5px] mono uppercase tracking-wider">arraste · edite · use</div>
          </button>
        </div>
      </div>
    </section>
  );
};

window.HomeScreen = HomeScreen;
export { HomeScreen };
