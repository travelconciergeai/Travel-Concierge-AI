import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";

// Explore — marketplace / editorial of routes. Pinterest-meets-Airbnb editorial.

const ExploreScreen = ({ setRoute, openExpertProfile }) => {
  const cats = ['Todos','Disney','Europa','Família','Premium','Econômico','Gastronomia','Lua de mel','Aventura','Japão','Praia'];
  const [cat, setCat] = useState('Todos');
  const [open, setOpen] = useState(null);
  const list = mockData.routes.filter(r => cat === 'Todos' || r.category === cat || r.title.toLowerCase().includes(cat.toLowerCase()));
  const toast = useToast();

  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Explorar" title="Roteiros editoriais"
        right={
          <>
            <Button variant="ghost" icon={Icon.Filter}>Filtros</Button>
            <Button variant="secondary" icon={Icon.Sparkles}>Pedir um sob medida</Button>
          </>
        }/>

      {/* feature hero */}
      <div className="px-10 mb-8">
        <Card className="grid grid-cols-[1.2fr_1fr] overflow-hidden">
          <div className="p-8 flex flex-col justify-between">
            <div>
              <Tag tone="brand" className="whitespace-nowrap"><Icon.Sparkles size={11}/> em destaque</Tag>
              <h2 className="text-[30px] tracking-tight font-medium text-ink-900 mt-4 leading-tight">
                Outono no <span className="serif-i">Mediterrâneo,</span> sem multidão.
              </h2>
              <p className="text-[14px] text-ink-600 mt-3 leading-relaxed max-w-[480px]">
                7 roteiros autorais assinados pelos nossos experts. Itália, Grécia, Croácia e sul de Portugal —
                hotéis boutique, jantares reservados, transporte fácil.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button icon={Icon.ArrowRight}>Explorar coleção</Button>
              <Button variant="ghost">Salvar</Button>
            </div>
          </div>
          <SmartImg seed="explore-hero" tone="warm" label="Sul da Itália · outubro" w={800} h={600} className="min-h-[280px]"/>
        </Card>
      </div>

      {/* Explore by expert — circular avatars row */}
      <div className="px-10 mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="label whitespace-nowrap">Quem assina seus roteiros</div>
            <div className="text-[20px] tracking-tight font-medium text-ink-900 mt-1.5">Explorar por experts</div>
          </div>
          <Button variant="ghost" iconRight={Icon.ArrowRight} onClick={() => setRoute('experts')}>Ver todos</Button>
        </div>
        <div className="flex items-start gap-6 overflow-x-auto pb-2 -mx-10 px-10">
          {mockData.experts.map(e => (
            <button key={e.id}
              onClick={() => { setRoute('experts'); openExpertProfile && openExpertProfile(e.id); }}
              className="flex flex-col items-center gap-3 shrink-0 group w-[110px]">
              <div className="relative">
                <SmartImg seed={`expert-${e.id}`} tone={e.tone} w={300} h={300}
                  className="h-[88px] w-[88px] rounded-full ring-1 ring-ink-200 group-hover:ring-2 group-hover:ring-ink-900 transition-all"/>
                <div className="absolute -bottom-1 -right-1 bg-paper border-half rounded-full h-6 px-1.5 flex items-center gap-1 text-[10.5px] font-medium text-ink-900 shadow-soft">
                  <Icon.Star size={9}/> {e.rating}
                </div>
              </div>
              <div className="text-center w-full">
                <div className="text-[12.5px] font-medium text-ink-900 leading-tight truncate">{e.name.split(' ')[0]}</div>
                <div className="text-[10.5px] text-ink-500 mt-0.5 truncate">{e.region.split(' & ')[0]}</div>
              </div>
            </button>
          ))}
          <button onClick={() => setRoute('experts')}
            className="flex flex-col items-center gap-3 shrink-0 group w-[110px]">
            <div className="h-[88px] w-[88px] rounded-full border-half border-dashed bg-white flex items-center justify-center text-ink-500 group-hover:text-ink-900 group-hover:bg-ink-100 transition-colors">
              <Icon.Plus size={20}/>
            </div>
            <div className="text-center w-full">
              <div className="text-[12.5px] font-medium text-ink-900 leading-tight truncate">Ver todos</div>
              <div className="text-[10.5px] text-ink-500 mt-0.5 truncate">{mockData.experts.length} experts</div>
            </div>
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="px-10">
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`h-8 px-3 rounded-full text-[12.5px] border transition-colors ${
                cat === c ? 'bg-ink-900 text-paper border-ink-900' : 'bg-white text-ink-700 hairline hover:border-ink-400'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Route grid — uniform cards */}
      <div className="px-10 pb-12 grid grid-cols-3 gap-5">
        {list.map((r) => (
          <button key={r.id} onClick={() => setOpen(r)}
            className="bg-white border-half rounded-2xl overflow-hidden text-left card-h flex flex-col h-[400px]">
            {/* Image fills top, fixed height, no padding above */}
            <SmartImg seed={`route-${r.id}`} tone={r.tone} label={r.category} w={600} h={400} className="h-[200px] w-full shrink-0"/>
            {/* Body */}
            <div className="p-5 flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-ink-500">
                <span>{r.category}</span><span className="text-ink-300">·</span><span>{r.days} dias</span>
              </div>
              <div className="text-[16px] font-medium tracking-tight text-ink-900 mt-2 leading-snug line-clamp-2">{r.title}</div>
              <div className="text-[12.5px] text-ink-500 mt-2 flex items-center gap-1.5">
                <Icon.Sparkles size={11} className="text-ink-900"/> Por {r.expert}
              </div>
              {/* Footer pinned bottom */}
              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <div className="text-[12.5px] text-ink-700 whitespace-nowrap">desde <span className="font-medium text-ink-900">{r.from}</span></div>
                <span className="text-[12.5px] text-ink-900 font-medium inline-flex items-center gap-1 whitespace-nowrap">
                  Ver roteiro <Icon.ArrowRight size={12}/>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Route preview modal */}
      <Modal open={!!open} onClose={() => setOpen(null)} size="lg" title={open?.title || ''}
        footer={open && <>
          <Button variant="ghost" onClick={() => setOpen(null)}>Fechar</Button>
          <Button variant="secondary" icon={Icon.Heart}>Salvar</Button>
          <Button icon={Icon.Sparkles} onClick={() => { setRoute('plan'); setOpen(null); }}>Usar como base</Button>
        </>}>
        {open && (
          <div className="space-y-5">
            <SmartImg seed={`route-cover-${open.id}`} tone={open.tone} label={open.category} w={1000} h={500} className="h-[220px] rounded-xl"/>
            <div className="grid grid-cols-4 gap-3">
              <Mini2 label="Dias"     value={open.days}/>
              <Mini2 label="A partir" value={open.from}/>
              <Mini2 label="Expert"   value={open.expert.split(' ')[0]}/>
              <Mini2 label="Categoria" value={open.category}/>
            </div>
            <div>
              <div className="label mb-2">O que está incluído</div>
              <ul className="grid grid-cols-2 gap-y-1.5 text-[13px] text-ink-700">
                <Inc>Hotéis boutique selecionados</Inc>
                <Inc>Transporte entre cidades</Inc>
                <Inc>3 jantares com reserva</Inc>
                <Inc>Walking tours autorais</Inc>
                <Inc>Suporte 24/7 via chat</Inc>
                <Inc>Mapas e backup offline</Inc>
              </ul>
            </div>
            <div className="bg-ink-50 border-half rounded-xl p-4 flex gap-3">
              <Icon.Sparkles size={16} className="text-ink-900 mt-0.5"/>
              <div className="text-[13px] text-ink-700">
                A Voya adapta este roteiro às suas datas, orçamento e ritmo. Pode mudar tudo. Pode tirar metade. É <span className="font-medium text-ink-900">seu</span> depois disso.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Mini2 = ({ label, value }) => (
  <div className="bg-ink-50 rounded-xl p-3">
    <div className="label">{label}</div>
    <div className="text-[15px] font-medium text-ink-900 mt-0.5 truncate">{value}</div>
  </div>
);
const Inc = ({ children }) => (
  <li className="flex items-center gap-2"><Icon.Check size={12} className="text-ink-900"/> {children}</li>
);

window.ExploreScreen = ExploreScreen;
export { ExploreScreen };
