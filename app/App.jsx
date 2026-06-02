import React, { useState } from 'react';

const navPrimary = [
  ['Início', '⌂'],
  ['Experts', '◎'],
  ['Explorar', '◇'],
  ['Minhas viagens', '□'],
];

const navBooking = [
  ['Voos', '✈'],
  ['Hotéis', '▭'],
  ['Passeios', '◌'],
];

function Sidebar({ route, setRoute }) {
  const renderItem = ([label, icon]) => {
    const active = route === label;
    return (
      <button
        key={label}
        onClick={() => setRoute(label)}
        className={`w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] transition-colors ${active ? 'bg-ink-900 text-paper' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'}`}
      >
        <span className="w-4 text-center">{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 border-r hairline bg-paper flex flex-col">
      <div className="px-5 pt-6 pb-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-ink-900 text-paper flex items-center justify-center font-semibold">G</div>
        <div className="flex-1">
          <div className="text-[15px] font-medium tracking-tight text-ink-900">Gaid</div>
          <div className="text-[11px] text-ink-500 -mt-0.5">concierge de viagens</div>
        </div>
      </div>

      <button className="mx-3 mb-4 h-9 px-3 rounded-lg bg-white border hairline text-[12.5px] text-ink-500 flex items-center gap-2 hover:border-ink-400 transition-colors">
        <span>⌕</span>
        <span>Pesquisar ou pedir</span>
        <span className="ml-auto mono text-[10px] text-ink-400">⌘K</span>
      </button>

      <div className="px-3 space-y-0.5">{navPrimary.map(renderItem)}</div>
      <div className="px-3 pt-5 space-y-0.5">
        <div className="label px-3 pb-1">Reservar</div>
        {navBooking.map(renderItem)}
      </div>
    </aside>
  );
}

function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;
    setInput('');
    setMessages((items) => [...items, { who: 'user', text: message }]);
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, messages, activeTripContext: {} }),
      });
      const data = await response.json();
      setMessages((items) => [...items, { who: 'agent', text: data.reply || 'Não consegui responder agora. Tenta novamente daqui a pouquinho.' }]);
    } catch {
      setMessages((items) => [...items, { who: 'agent', text: 'Não consegui responder agora. Tenta novamente daqui a pouquinho.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 min-w-0 min-h-screen bg-canvas">
      <header className="px-10 pt-8 pb-2 flex items-center justify-end gap-2">
        <button className="h-10 px-4 text-sm rounded-xl bg-white border border-edge text-ink-900 hover:border-ink-400 hover:bg-ink-50">Nova viagem</button>
      </header>

      <section className="px-10 pt-16 pb-10">
        <div className="max-w-[860px] mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-2 h-6 text-[11px] tracking-wide rounded-full border bg-brand-50 text-brand-700 border-brand-100">✦ Concierge premium · IA + experts reais</div>
          <h1 className="mt-5 text-[52px] leading-[1.04] tracking-[-0.025em] font-medium text-ink-900">
            Olá!
            <br />
            <span className="serif-i">Qual será a sua próxima viagem?</span>
          </h1>

          <div className="mt-9 mx-auto max-w-[720px]">
            <div className="bg-white border-half rounded-full shadow-card h-[60px] pl-5 pr-[6px] flex items-center gap-2 transition-shadow hover:shadow-lift focus-within:shadow-lift">
              <span className="text-ink-500 shrink-0">✦</span>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && send()}
                placeholder="Conte destino, datas, companhia ou o tipo de viagem..."
                className="flex-1 h-full outline-none text-[14px] placeholder:text-ink-400 bg-transparent leading-none"
              />
              <button
                onClick={send}
                disabled={loading}
                className="h-12 px-5 rounded-full bg-ink-900 text-paper hover:bg-ink-800 transition-colors flex items-center gap-2 text-[13.5px] font-medium shrink-0 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>

          <div className="mt-10 max-w-[720px] mx-auto space-y-3 text-left">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.who === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${message.who === 'user' ? 'bg-ink-900 text-paper rounded-tr-md' : 'text-ink-900 bg-white border-half'}`}>{message.text}</div>
              </div>
            ))}
            {loading && <div className="flex gap-1 pt-1 pl-1"><span className="dot h-1.5 w-1.5 rounded-full bg-ink-400"/><span className="dot h-1.5 w-1.5 rounded-full bg-ink-400"/><span className="dot h-1.5 w-1.5 rounded-full bg-ink-400"/></div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function PlaceholderScreen({ title }) {
  return (
    <main className="flex-1 min-w-0 min-h-screen bg-canvas px-10 py-10">
      <div className="label mb-2">Gaid</div>
      <h1 className="text-[28px] tracking-tight font-medium text-ink-900">{title}</h1>
      <div className="mt-8 border-half border-dashed rounded-3xl bg-white/60 px-8 py-14 text-center text-ink-500">Esta área está pronta para receber dados reais.</div>
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState('Início');
  return (
    <div className="flex bg-canvas min-h-screen">
      <Sidebar route={route} setRoute={setRoute} />
      {route === 'Início' ? <Home /> : <PlaceholderScreen title={route} />}
    </div>
  );
}
