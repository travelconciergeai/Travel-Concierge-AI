import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";

// Experts — editorial creator-economy feel. Portrait + stats cards + region filters.

const ExpertsScreen = ({ setRoute, initialOpen, clearInitialOpen }) => {
  const [open, setOpen] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const [filter, setFilter] = useState('todos');
  const toast = useToast();

  // Region/spec filters — explicit and on-brand.
  const filters = [
    { id: 'todos',     label: 'Todos' },
    { id: 'Disney',    label: 'Disney & família' },
    { id: 'Europa',    label: 'Europa' },
    { id: 'Itália',    label: 'Itália' },
    { id: 'Portugal',  label: 'Portugal' },
    { id: 'Japão',     label: 'Japão' },
    { id: 'Caribe',    label: 'Caribe' },
    { id: 'África',    label: 'África & safári' },
    { id: 'Premium',   label: 'Luxo' },
  ];

  useEffect(() => {
    if (initialOpen) {
      const e = mockData.experts.find(x => x.id === initialOpen);
      if (e) setOpen(e);
      clearInitialOpen && clearInitialOpen();
    }
  }, [initialOpen]);

  const list = mockData.experts.filter(e => {
    if (filter === 'todos') return true;
    return (e.regions || []).includes(filter) || e.specs.includes(filter) || e.region.includes(filter);
  });

  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Experts" title="Pessoas que viajam por você"
        right={<Button variant="secondary" icon={Icon.Search}>Buscar especialista</Button>}/>

      {/* editorial hero */}
      <div className="px-10 mb-8">
        <Card className="grid grid-cols-[1fr_360px] overflow-hidden">
          <div className="p-9 flex flex-col justify-center">
            <Tag tone="ink" className="whitespace-nowrap"><Icon.Award size={11}/> Voya Editorial</Tag>
            <h2 className="text-[34px] tracking-tight font-medium text-ink-900 leading-[1.1] mt-5">
              IA é só metade.<br/>
              <span className="serif-i">A outra metade tem nome.</span>
            </h2>
            <p className="text-[14.5px] text-ink-600 mt-4 leading-relaxed max-w-[560px]">
              Nossos experts moram nos destinos, conhecem o concierge do restaurante, sabem qual dia da semana o museu vazio fica vazio.
              Eles supervisionam o roteiro que a Voya monta — e atendem por mensagem em minutos.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={() => toast({title:'Mensagem enviada à Inês', tone:'success'})} icon={Icon.Sparkles}>Falar com expert agora</Button>
              <Button variant="ghost" iconRight={Icon.ArrowRight} onClick={() => setRoute('explore')}>Ver roteiros assinados</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2 bg-canvas">
            {mockData.experts.slice(0, 4).map(e => (
              <SmartImg key={e.id} seed={`expert-hero-${e.id}`} tone={e.tone} label={e.region.split(' ')[0]} w={400} h={400} className="aspect-square rounded-xl"/>
            ))}
          </div>
        </Card>
      </div>

      {/* Region filters */}
      <div className="px-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="label">Filtrar por especialidade</div>
            <div className="text-[15px] text-ink-700 mt-1">Encontre quem entende do destino que você quer</div>
          </div>
          <div className="text-[12px] text-ink-500">{list.length} de {mockData.experts.length} experts</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.id} onClick={()=>setFilter(f.id)}
              className={`h-9 px-4 rounded-full text-[13px] border transition-colors ${
                filter===f.id ? 'bg-ink-900 text-paper border-ink-900' : 'bg-white text-ink-700 hairline hover:border-ink-400'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expert cards — portrait left + stats right */}
      <div className="px-10 pb-12 grid grid-cols-2 gap-5">
        {list.map(e => (
          <ExpertCard key={e.id} expert={e} onOpen={() => setOpen(e)}/>
        ))}
        {list.length === 0 && (
          <div className="col-span-2 bg-white border-half rounded-2xl p-10 text-center">
            <div className="text-[15px] text-ink-700">Nenhum expert para esse filtro ainda.</div>
            <div className="text-[12.5px] text-ink-500 mt-1">Pode pedir pra Voya assinar uma viagem sob medida — sempre temos quem encaixe.</div>
          </div>
        )}
      </div>

      {/* Expert profile modal */}
      <Modal open={!!open} onClose={() => setOpen(null)} size="lg" title={open?.name || ''}
        footer={open && <>
          <Button variant="ghost" onClick={() => setOpen(null)}>Fechar</Button>
          <Button icon={Icon.Mail} onClick={() => { setOpen(null); toast({title:`Mensagem enviada para ${open.name}`, tone:'success', desc:'Resposta em ~2 min'}); }}>
            Falar com {open.name.split(' ')[0]}
          </Button>
        </>}>
        {open && (
          <div className="space-y-5">
            <div className="grid grid-cols-[200px_1fr] gap-5">
              <SmartImg seed={`expert-portrait-${open.id}`} tone={open.tone} w={400} h={500} className="h-[200px] rounded-xl"/>
              <div>
                <Tag tone="ink"><Icon.Star size={11}/> {open.rating} · {open.trips} viagens</Tag>
                <div className="text-[22px] font-medium tracking-tight text-ink-900 mt-3">{open.name}</div>
                <div className="text-[13px] text-ink-500">{open.region}</div>
                <div className="serif-i text-[18px] mt-3 leading-snug">"{open.quote}"</div>
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {open.specs.map(s => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
            </div>

            <div>
              <div className="label mb-2">Sobre</div>
              <p className="text-[13.5px] text-ink-700 leading-relaxed">{open.bio}</p>
            </div>

            <div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="label">Roteiros assinados por {open.name.split(' ')[0]}</div>
                  <div className="text-[13px] text-ink-600 mt-1">Use como base — a Voya adapta às suas datas e ritmo.</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mockData.routes.filter(r => r.expert === open.name).slice(0,4).map(r => (
                  <div key={r.id} className="bg-white border-half rounded-xl overflow-hidden flex">
                    <SmartImg seed={`route-${r.id}`} tone={r.tone} label={r.category} w={300} h={300} className="w-[110px] shrink-0"/>
                    <div className="p-3 flex-1 flex flex-col min-w-0">
                      <div className="text-[12.5px] font-medium text-ink-900 leading-snug line-clamp-2">{r.title}</div>
                      <div className="text-[11px] text-ink-500 mt-1">{r.days} dias · {r.from}</div>
                      <button onClick={() => { setOpen(null); setRouteDetail(r); }}
                        className="mt-auto h-8 px-3 rounded-lg bg-ink-900 text-paper hover:bg-ink-800 transition-colors text-[12px] font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <Icon.Sparkles size={11}/> Usar este roteiro
                      </button>
                    </div>
                  </div>
                ))}
                {mockData.routes.filter(r => r.expert === open.name).length === 0 && (
                  <div className="col-span-2 text-[12.5px] text-ink-500 bg-ink-50 rounded-xl p-4">Roteiros sob medida — fala com {open.name.split(' ')[0]}.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Mini label="Resposta média" value={`~${open.responseMin} min`} tone="sage"/>
              <Mini label="Aprovação" value="98%" tone="sage"/>
              <Mini label="Idiomas" value="PT · EN · ES"/>
            </div>
          </div>
        )}
      </Modal>

      <RouteDetailDrawer
        route={routeDetail}
        onClose={() => setRouteDetail(null)}
        onUse={() => { const r = routeDetail; setRouteDetail(null); toast({title:`Aplicando roteiro: ${r.title}`, tone:'success', desc:'Levando para o Plano…'}); setTimeout(() => setRoute('plan'), 600); }}
      />
    </div>
  );
};

// ---------- Expert card with portrait + stats ----------
const ExpertCard = ({ expert, onOpen }) => {
  return (
    <button onClick={onOpen}
      className="bg-white border-half rounded-2xl overflow-hidden text-left card-h flex">
      {/* Portrait left, fixed */}
      <SmartImg seed={`expert-${expert.id}`} tone={expert.tone} w={400} h={500} className="w-[200px] shrink-0"/>

      {/* Body right */}
      <div className="flex-1 p-5 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[17px] font-medium text-ink-900 tracking-tight">{expert.name}</div>
            <div className="text-[12px] text-ink-500 mt-0.5">{expert.region}</div>
          </div>
          <Tag tone="ink" className="shrink-0"><Icon.Star size={10}/> {expert.rating}</Tag>
        </div>

        <div className="serif-i text-[14.5px] text-ink-700 mt-3 leading-snug line-clamp-2">"{expert.quote}"</div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatTile value={expert.trips}    label="viagens"/>
          <StatTile value={expert.routes}   label="roteiros"/>
          <StatTile value={`~${expert.responseMin}m`} label="resposta"/>
        </div>

        {/* Specs + footer */}
        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          {expert.specs.slice(0,3).map(s => (
            <span key={s} className="text-[10.5px] px-2 h-5 rounded-full bg-ink-100 text-ink-700 flex items-center whitespace-nowrap">{s}</span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-2 text-[11.5px] text-ink-500">
          <span className="whitespace-nowrap">{expert.years} anos no destino</span>
          <span className="text-ink-900 font-medium inline-flex items-center gap-1 whitespace-nowrap">Ver perfil <Icon.ArrowRight size={11}/></span>
        </div>
      </div>
    </button>
  );
};

const StatTile = ({ value, label }) => (
  <div className="bg-ink-50 rounded-lg px-2.5 py-2">
    <div className="text-[16px] font-medium text-ink-900 leading-none">{value}</div>
    <div className="text-[10.5px] text-ink-500 mt-1.5 uppercase tracking-wider">{label}</div>
  </div>
);

// ---------- Route detail drawer (shared with Explore) ----------
const RouteDetailDrawer = ({ route, onClose, onUse }) => {
  if (!route) return null;
  const detail = mockData.routeDetails[route.id];
  return (
    <Drawer
      open={!!route}
      onClose={onClose}
      eyebrow={`${route.category} · ${route.days} dias · assinado por ${route.expert}`}
      title={detail?.title || route.title}
      width={640}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
        <Button variant="secondary" icon={Icon.Heart}>Salvar</Button>
        <Button icon={Icon.Sparkles} onClick={onUse}>Usar este roteiro</Button>
      </>}>
      <SmartImg seed={`route-cover-${route.id}`} tone={route.tone} label={route.category} w={1000} h={500} className="h-[240px]"/>

      <div className="px-6 py-5 border-b hairline">
        <p className="text-[14px] text-ink-700 leading-relaxed">{detail?.blurb || route.title}</p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <Mini label="Dias" value={`${route.days}`}/>
          <Mini label="A partir de" value={route.from}/>
          <Mini label="Expert" value={route.expert.split(' ')[0]}/>
        </div>
      </div>

      <div className="px-6 py-5 border-b hairline">
        <div className="label mb-3">O que está incluído</div>
        <div className="grid grid-cols-2 gap-y-2">
          {(detail?.includes || ['Hotéis selecionados','Transportes','Reservas','Suporte 24/7']).map((inc, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px] text-ink-800">
              <div className="h-5 w-5 rounded-full bg-ink-100 flex items-center justify-center"><Icon.Check size={11} className="text-ink-900"/></div>
              {inc}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="label mb-4">Dia a dia</div>
        <div className="space-y-4">
          {(detail?.days || []).map(d => (
            <div key={d.d} className="grid grid-cols-[64px_1fr] gap-4">
              <div>
                <div className="text-[28px] font-medium text-ink-900 leading-none">{String(d.d).padStart(2,'0')}</div>
                <div className="text-[11px] text-ink-500 mt-1">{d.city}</div>
              </div>
              <div className="bg-white border-half rounded-xl p-4">
                <div className="text-[12.5px] text-ink-600 italic mb-2">{d.theme}</div>
                <ul className="space-y-1.5">
                  {d.items.map((it, i) => (
                    <li key={i} className="text-[13px] text-ink-800 flex items-start gap-2">
                      <div className="h-1 w-1 rounded-full bg-ink-400 mt-2 shrink-0"/>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-ink-50 border-half rounded-xl p-4 flex items-start gap-3">
          <Icon.Sparkles size={16} className="text-ink-900 mt-0.5"/>
          <div className="text-[13px] text-ink-700 leading-relaxed">
            A Voya adapta este roteiro às suas datas, orçamento e ritmo. Pode mudar tudo. Pode tirar metade. É <span className="font-medium text-ink-900">seu</span> depois disso.
          </div>
        </div>
      </div>
    </Drawer>
  );
};

const Mini = ({ label, value, tone }) => (
  <div className="bg-ink-50 rounded-xl p-3">
    <div className="label">{label}</div>
    <div className={`text-[16px] font-medium mt-1 ${tone==='sage' ? 'text-sage-700' : 'text-ink-900'}`}>{value}</div>
  </div>
);

window.ExpertsScreen = ExpertsScreen;
window.RouteDetailDrawer = RouteDetailDrawer;
export { ExpertsScreen, RouteDetailDrawer };
