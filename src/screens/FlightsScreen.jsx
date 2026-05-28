import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { getStoredFlightSearchResults, subscribeFlightSearchResults } from "../lib/flightSearchState.js";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";

// Flights — list + miles compare. NO copyrighted airline UIs, original layout.

const FlightsScreen = ({ setRoute }) => {
  const [sort, setSort] = useState('best');
  const [picked, setPicked] = useState(null);
  const [searchFlights, setSearchFlights] = useState(() => getStoredFlightSearchResults());
  const toast = useToast();
  const flights = searchFlights.length ? searchFlights : mockData.flights;
  const ordered = [...flights].sort((a,b) => {
    if (sort === 'price') return (parseInt(a.price.replace(/\D/g,'')) || 999999999) - (parseInt(b.price.replace(/\D/g,'')) || 999999999);
    if (sort === 'time') return a.dep.localeCompare(b.dep);
    return 0;
  });

  useEffect(() => subscribeFlightSearchResults(setSearchFlights), []);

  const openBooking = (flight) => {
    if (flight.bookingUrl) {
      window.open(flight.bookingUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    toast({title:'Voo reservado', tone:'success', desc:`${flight.airline} ${flight.flight} confirmado`});
  };

  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Voos" title="Sugestões para sua viagem"
        right={<Button variant="ghost" icon={Icon.Filter}>Filtros</Button>}/>

      {/* search bar */}
      <div className="px-10">
        <Card className="p-2 mb-6">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] divide-x hairline">
            <SearchCell label="De"      value="GRU · São Paulo"      icon={Icon.Plane}/>
            <SearchCell label="Para"    value="LIS · Lisboa"          icon={Icon.MapPin}/>
            <SearchCell label="Datas"   value="12 out → 22 out"        icon={Icon.Calendar}/>
            <SearchCell label="Viajantes" value="2 adultos · executiva" icon={Icon.Users}/>
            <div className="flex items-center pl-2 pr-1">
              <Button icon={Icon.Search}>Buscar</Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <TabRow value={sort} onChange={setSort} tabs={[
            { id: 'best', label: 'Melhores' },
            { id: 'price', label: 'Mais barato' },
            { id: 'time', label: 'Por horário' },
          ]}/>
          <div className="text-[12px] text-ink-500">{ordered.length} resultados · trecho ida</div>
        </div>
      </div>

      <div className="px-10 pb-10 space-y-3">
        {ordered.map(f => (
          <Card key={f.id} className="p-5 flex items-center gap-6 card-h cursor-pointer" hover onClick={()=>setPicked(f)}>
            <Placeholder tone={f.tone} className="h-12 w-12 rounded-lg shrink-0"/>
            <div className="flex items-center gap-8 flex-1">
              <div>
                <div className="text-[20px] font-medium text-ink-900 leading-none">{f.dep}</div>
                <div className="text-[11.5px] text-ink-500 mt-1">{f.from}</div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="text-[11px] text-ink-500">{f.dur}</div>
                <div className="w-full flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-ink-900"/>
                  <div className="flex-1 h-px bg-ink-300 relative">
                    {f.stops !== 'Direto' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-ink-500"/>}
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-ink-900"/>
                </div>
                <div className="text-[11px] text-ink-500 mt-1">{f.stops}</div>
              </div>
              <div>
                <div className="text-[20px] font-medium text-ink-900 leading-none">{f.arr}</div>
                <div className="text-[11.5px] text-ink-500 mt-1">{f.to}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-ink-500">{f.airline} · {f.flight}</div>
              <div className="text-[20px] font-medium text-ink-900 mt-1">{f.price}</div>
              <div className="text-[11.5px] text-coral-700 mt-1">ou {f.miles}</div>
            </div>
            <Tag tone={f.best==='preço'?'sage':f.best==='milhas'?'brand':'gold'}>
              <Icon.Sparkles size={11}/> melhor {f.best}
            </Tag>
          </Card>
        ))}
      </div>

      {/* Flight detail */}
      <Modal open={!!picked} onClose={()=>setPicked(null)} size="lg" title="Detalhe do voo"
        footer={picked && <>
          <Button variant="ghost" onClick={()=>setPicked(null)}>Fechar</Button>
          <Button variant="secondary" icon={Icon.Coins}>Usar milhas</Button>
          <Button icon={Icon.Check} onClick={() => { openBooking(picked); setPicked(null); }}>Reservar</Button>
        </>}>
        {picked && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Mini3 label="Cabine" value={picked.cabin || "Executiva"}/>
              <Mini3 label="Bagagem" value={picked.baggage || "2 × 32 kg"} tone="sage"/>
              <Mini3 label="Seguro Voya" value="Ativo" tone="sage"/>
              <Mini3 label="Refeição" value="Premium"/>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-[13px] text-brand-900">
              <div className="font-medium">Voya recomenda: pagar com TAP Miles & Go · Infinite</div>
              <div className="mt-1 opacity-90">+78.000 milhas para a sua conta · seguro premium ativado automaticamente.</div>
            </div>
            <div>
              <div className="label mb-2">Mesma rota — comparar</div>
              <div className="space-y-1.5">
                {ordered.filter(x=>x.id!==picked.id).map(x => (
                  <div key={x.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink-50">
                    <Placeholder tone={x.tone} className="h-7 w-7 rounded-md"/>
                    <div className="flex-1 text-[12.5px] text-ink-700">{x.airline} · {x.dep} → {x.arr} · {x.stops}</div>
                    <div className="text-[12.5px] font-medium">{x.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const SearchCell = ({ label, value, icon: Ic }) => (
  <button className="px-4 py-2.5 text-left hover:bg-ink-50 transition-colors">
    <div className="label mb-0.5">{label}</div>
    <div className="text-[13.5px] text-ink-900 font-medium truncate">{value}</div>
  </button>
);
const Mini3 = ({ label, value, tone }) => (
  <div className="bg-ink-50 rounded-xl p-3">
    <div className="label">{label}</div>
    <div className={`text-[14px] font-medium mt-0.5 ${tone==='sage'?'text-sage-700':'text-ink-900'}`}>{value}</div>
  </div>
);

window.FlightsScreen = FlightsScreen;
export { FlightsScreen };
