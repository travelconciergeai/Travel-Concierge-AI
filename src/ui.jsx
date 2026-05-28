// Shared UI primitives for Voya. Keep these small + composable.

import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { Icon } from './icons.jsx';
import { isRealDataMode } from './lib/dataMode.js';

// ---------- Placeholder "photography" ----------
// We never draw real imagery; show striped placeholders with a caption.
const Placeholder = ({ tone = 'warm', label, className = '', children, intense = false }) => {
  const toneCls = {
    warm:  'ph-warm',
    cool:  'ph-cool',
    sage:  'ph-sage',
    coral: 'ph-coral',
    ink:   'ph-ink',
    paper: 'ph-stripes',
  }[tone] || 'ph-stripes';
  return (
    <div className={`relative overflow-hidden ${toneCls} ${className}`}>
      {label && (
        <div className={`absolute left-3 bottom-3 mono text-[10px] tracking-wider uppercase
                         ${tone === 'ink' ? 'text-white/80' : 'text-ink-700/70'}`}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

// ---------- Button ----------
const Button = ({ variant = 'primary', size = 'md', children, icon: IconC, iconRight: IconR, className = '', ...rest }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none active:scale-[.985]';
  const sizes = {
    sm: 'h-8 px-3 text-[13px] rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-5 text-[15px] rounded-xl',
  }[size];
  const variants = {
    primary:   'bg-ink-900 text-paper hover:bg-ink-800',
    secondary: 'bg-white border border-edge text-ink-900 hover:border-ink-400 hover:bg-ink-50',
    ghost:     'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
    accent:    'bg-brand-600 text-white hover:bg-brand-700',
    soft:      'bg-ink-100 text-ink-900 hover:bg-ink-200',
    danger:    'bg-coral-500 text-white hover:bg-coral-700',
  }[variant];
  return (
    <button {...rest} className={`${base} ${sizes} ${variants} ${className}`}>
      {IconC && <IconC size={size === 'sm' ? 14 : 16}/>}
      {children}
      {IconR && <IconR size={size === 'sm' ? 14 : 16}/>}
    </button>
  );
};

// ---------- Tag / Chip ----------
const Tag = ({ children, tone = 'ink', className = '' }) => {
  const tones = {
    ink:   'bg-ink-100 text-ink-700 border-ink-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    sage:  'bg-sage-50 text-sage-700 border-sage-50',
    coral: 'bg-coral-50 text-coral-700 border-coral-50',
    gold:  'bg-gold-50 text-gold-700 border-gold-50',
    white: 'bg-white/90 text-ink-800 border-edge backdrop-blur',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 h-6 text-[11px] tracking-wide rounded-full border whitespace-nowrap ${tones} ${className}`}>
      {children}
    </span>
  );
};

// ---------- Card ----------
const Card = ({ className = '', children, hover = false, ...rest }) => (
  <div {...rest}
    className={`bg-white border hairline rounded-2xl shadow-soft ${hover ? 'card-h cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

// ---------- Modal ----------
const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm fade-up" onClick={onClose}/>
      <div className={`relative bg-white border hairline rounded-3xl shadow-pop w-full ${widths} max-h-[88vh] flex flex-col fade-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b hairline">
          <div className="font-medium text-ink-900">{title}</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink-100 text-ink-600">
            <Icon.X size={16}/>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t hairline px-6 py-4 flex items-center justify-end gap-2 bg-ink-50/40 rounded-b-3xl">{footer}</div>}
      </div>
    </div>
  );
};

// ---------- Toast system ----------
const ToastCtx = createContext(null);
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((xs) => [...xs, { id, ...t }]);
    setTimeout(() => setToasts((xs) => xs.filter(x => x.id !== id)), t.duration || 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id}
               className="flex items-start gap-3 bg-white border hairline rounded-xl shadow-lift px-4 py-3 min-w-[280px] max-w-[360px] fade-up">
            <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center
                            ${t.tone === 'success' ? 'bg-sage-50 text-sage-700' :
                              t.tone === 'info' ? 'bg-brand-50 text-brand-700' :
                              'bg-ink-100 text-ink-700'}`}>
              {t.tone === 'success' ? <Icon.Check size={16}/> : <Icon.Sparkles size={16}/>}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-ink-900">{t.title}</div>
              {t.desc && <div className="text-[12px] text-ink-600 mt-0.5">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => useContext(ToastCtx);

// ---------- Sidebar ----------
const Sidebar = ({ route, setRoute, openCmd }) => {
  const items = [
    { id: 'home',    label: 'Início',          icon: Icon.Home },
    { id: 'experts', label: 'Experts',         icon: Icon.Users },
    { id: 'plan',    label: 'Roteiro ativo',   icon: Icon.Map },
    { id: 'explore', label: 'Explorar',        icon: Icon.Compass },
    { id: 'trips',   label: 'Minhas viagens',  icon: Icon.Calendar },
  ];
  const items2 = [
    { id: 'flights', label: 'Voos',     icon: Icon.Plane },
    { id: 'hotels',  label: 'Hotéis',   icon: Icon.Bed },
    { id: 'tours',   label: 'Passeios', icon: Icon.Ticket },
  ];
  const items3 = [
    { id: 'wallet',  label: 'Wallet',    icon: Icon.Wallet },
    { id: 'miles',   label: 'Milhas',    icon: Icon.Coins },
    { id: 'plans',   label: 'Planos',    icon: Icon.Award },
  ];
  const NavItem = ({ it }) => {
    const ActiveIcon = it.icon;
    const active = route === it.id;
    return (
      <button
        onClick={() => setRoute(it.id)}
        className={`group w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] transition-colors
                    ${active ? 'bg-ink-900 text-paper' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'}`}>
        <ActiveIcon size={16}/>
        <span>{it.label}</span>
      </button>
    );
  };
  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 border-r hairline bg-paper flex flex-col">
      <div className="px-5 pt-6 pb-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-ink-900 text-paper flex items-center justify-center">
          <Icon.Logo size={18}/>
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-medium tracking-tight text-ink-900">Voya</div>
          <div className="text-[11px] text-ink-500 -mt-0.5">concierge de viagens</div>
        </div>
      </div>

      <button onClick={openCmd}
        className="mx-3 mb-4 h-9 px-3 rounded-lg bg-white border hairline text-[12.5px] text-ink-500 flex items-center gap-2 hover:border-ink-400 transition-colors">
        <Icon.Search size={14}/>
        <span>Pesquisar ou pedir</span>
        <span className="ml-auto mono text-[10px] text-ink-400">⌘K</span>
      </button>

      <div className="px-3 space-y-0.5">
        {items.map(it => <NavItem key={it.id} it={it}/>)}
      </div>
      <div className="px-3 pt-5 space-y-0.5">
        <div className="label px-3 pb-1">Reservar</div>
        {items2.map(it => <NavItem key={it.id} it={it}/>)}
      </div>
      <div className="px-3 pt-5 space-y-0.5">
        <div className="label px-3 pb-1">Sua Voya</div>
        {items3.map(it => <NavItem key={it.id} it={it}/>)}
      </div>

      <div className="mt-auto p-3">
        <div className="bg-white border hairline rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-coral-500 to-brand-600 text-white flex items-center justify-center text-[12px] font-medium">HA</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-ink-900 truncate">{isRealDataMode() ? 'Voya' : mockData.user.name}</div>
            <div className="text-[11px] text-ink-500 truncate">{isRealDataMode() ? 'modo real' : mockData.user.tier}</div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500">
            <Icon.Settings size={14}/>
          </button>
        </div>
      </div>
    </aside>
  );
};

// ---------- Top bar ----------
const Topbar = ({ title, subtitle, right }) => (
  <div className="px-10 pt-8 pb-6 flex items-end justify-between gap-6">
    <div className="min-w-0">
      <div className="label mb-1">{subtitle || 'Voya'}</div>
      <h1 className="text-[28px] tracking-tight font-medium text-ink-900 leading-none">{title}</h1>
    </div>
    <div className="flex items-center gap-2">{right}</div>
  </div>
);

// ---------- Section header ----------
const SectionHeader = ({ eyebrow, title, action }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      {eyebrow && <div className="label mb-1">{eyebrow}</div>}
      <h2 className="text-[19px] tracking-tight font-medium text-ink-900">{title}</h2>
    </div>
    {action}
  </div>
);

// ---------- Command palette ----------
const CmdPalette = ({ open, onClose, setRoute }) => {
  const items = useMemo(() => [
    { id: 'home',    label: 'Início',         hint: 'tela inicial',     route: 'home',    icon: Icon.Home },
    { id: 'plan',    label: 'Roteiro ativo',  hint: 'Portugal · out',   route: 'plan',    icon: Icon.Map },
    { id: 'wallet',  label: 'Wallet',         hint: 'cartões · milhas', route: 'wallet',  icon: Icon.Wallet },
    { id: 'experts', label: 'Experts',        hint: '6 especialistas',  route: 'experts', icon: Icon.Users },
    { id: 'explore', label: 'Explorar',       hint: 'roteiros prontos', route: 'explore', icon: Icon.Compass },
    { id: 'flights', label: 'Voos',           hint: 'busca + milhas',   route: 'flights', icon: Icon.Plane },
    { id: 'hotels',  label: 'Hotéis',         hint: 'Voya Collection',  route: 'hotels',  icon: Icon.Bed },
    { id: 'tours',   label: 'Passeios',       hint: 'curados',          route: 'tours',   icon: Icon.Ticket },
    { id: 'trips',   label: 'Minhas viagens', hint: '4 ativas',         route: 'trips',   icon: Icon.Calendar },
    { id: 'plans',   label: 'Planos',         hint: 'Signature',        route: 'plans',   icon: Icon.Award },
  ], []);
  const [q, setQ] = useState('');
  const filtered = items.filter(i => (i.label + ' ' + i.hint).toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { if (open) setQ(''); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] p-6">
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm fade-up" onClick={onClose}/>
      <div className="relative bg-white border hairline rounded-2xl shadow-pop w-full max-w-xl overflow-hidden fade-up">
        <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
          <Icon.Search size={16} className="text-ink-500"/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
                 placeholder="O que você procura?"
                 className="flex-1 outline-none text-[14px] placeholder:text-ink-400"/>
          <span className="mono text-[10px] text-ink-400">esc</span>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-ink-500">Nada por aqui. Tente "experts" ou "milhas".</div>
          ) : filtered.map(it => {
            const Ic = it.icon;
            return (
              <button key={it.id} onClick={() => { setRoute(it.route); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink-50 text-left">
                <div className="h-8 w-8 rounded-lg bg-ink-100 text-ink-700 flex items-center justify-center"><Ic size={15}/></div>
                <div className="flex-1">
                  <div className="text-[13.5px] text-ink-900">{it.label}</div>
                  <div className="text-[11.5px] text-ink-500">{it.hint}</div>
                </div>
                <Icon.ChevronRight size={14} className="text-ink-400"/>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------- Misc ----------
const Stat = ({ label, value, hint, tone }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <div className="label">{label}</div>
    <div className="text-[22px] tracking-tight font-medium text-ink-900 leading-none">{value}</div>
    {hint && <div className={`text-[12px] mt-0.5 ${tone === 'sage' ? 'text-sage-700' : 'text-ink-500'}`}>{hint}</div>}
  </div>
);

const TabRow = ({ tabs, value, onChange, className = '' }) => (
  <div className={`inline-flex p-1 bg-ink-100 rounded-xl ${className}`}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        className={`px-3 h-8 rounded-lg text-[12.5px] font-medium transition-colors
                    ${value === t.id ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-600 hover:text-ink-900'}`}>
        {t.label}
      </button>
    ))}
  </div>
);

// ---------- Optimize-route dropdown ----------
// Modes the AI applies to the active itinerary. Each one shows a short delta
// so the user knows what will change before clicking.
const OPTIMIZE_MODES = [
  {
    id: 'value',
    label: 'Melhor custo-benefício',
    desc: 'Mantém a essência, corta gordura nos extras.',
    delta: '−R$ 3.200 · sem perder o que importa',
    icon: 'Coins',
  },
  {
    id: 'luxury',
    label: 'Modo luxo',
    desc: 'Hotéis signature, jantares estrelados, transfers privados.',
    delta: '+R$ 6.800 · 2 upgrades · 3 reservas premium',
    icon: 'Award',
  },
  {
    id: 'experience',
    label: 'Foco em experiência',
    desc: 'Menos turistão, mais autoral e memorável.',
    delta: '4 trocas · 2 experts locais entram em cena',
    icon: 'Sparkles',
  },
  {
    id: 'breath',
    label: 'Mais respiro',
    desc: 'Menos atividades por dia, mais tempo livre.',
    delta: '−5 itens · 2 manhãs livres · ritmo lento',
    icon: 'Coffee',
  },
  {
    id: 'food',
    label: 'Gastronomia em foco',
    desc: 'Restaurantes autorais, mercados e mãos na massa.',
    delta: '+4 reservas · 1 aula de culinária · 2 mercados',
    icon: 'Utensils',
  },
  {
    id: 'romance',
    label: 'Romântico',
    desc: 'Íntimo, jantares com vista, manhãs lentas.',
    delta: 'Casal · 3 jantares · spa · sunset boat',
    icon: 'Heart',
  },
  {
    id: 'miles',
    label: 'Maximizar milhas',
    desc: 'Paga tudo em pontos, otimiza emissões.',
    delta: '−R$ 7.400 · 184k milhas · bônus 140% ativado',
    icon: 'Sparkles',
  },
];

const OptimizeMenu = ({ onApply, anchor = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-2 h-8 pl-3 pr-2.5 rounded-lg text-[12.5px] font-medium transition-colors
                   ${open ? 'bg-ink-900 text-paper' : 'bg-white border-half text-ink-900 hover:border-ink-400'}`}>
        <Icon.Sparkles size={13}/>
        Otimizar roteiro
        <Icon.ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className={`absolute top-[calc(100%+6px)] ${anchor === 'right' ? 'right-0' : 'left-0'}
                         w-[360px] bg-white border-half rounded-2xl shadow-pop p-1.5 z-50 pop-down`}>
          <div className="px-3 pt-2.5 pb-2">
            <div className="text-[10.5px] tracking-[0.14em] uppercase font-medium text-ink-500">Voya · IA aplicada ao roteiro</div>
            <div className="text-[13px] text-ink-600 mt-1 leading-snug">Escolha um foco e a Voya recompõe tudo em segundos. Você pode desfazer.</div>
          </div>
          <div className="h-px bg-ink-200 mx-1.5 my-1.5"/>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            {OPTIMIZE_MODES.map(m => {
              const Ic = Icon[m.icon] || Icon.Sparkles;
              return (
                <button key={m.id}
                  onClick={() => { setOpen(false); onApply && onApply(m); }}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-100 transition-colors group">
                  <div className="h-8 w-8 rounded-lg bg-ink-100 group-hover:bg-white text-ink-900 flex items-center justify-center shrink-0 transition-colors">
                    <Ic size={14}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-ink-900 leading-tight">{m.label}</div>
                    <div className="text-[12px] text-ink-600 mt-0.5 leading-snug">{m.desc}</div>
                    <div className="text-[11px] mono text-ink-500 mt-1.5">{m.delta}</div>
                  </div>
                  <Icon.ArrowRight size={13} className="text-ink-400 group-hover:text-ink-900 mt-2 shrink-0"/>
                </button>
              );
            })}
          </div>
          <div className="h-px bg-ink-200 mx-1.5 my-1.5"/>
          <button onClick={() => { setOpen(false); onApply && onApply({ id: 'custom', label: 'Personalizado' }); }}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-100 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-ink-900 text-paper flex items-center justify-center shrink-0">
              <Icon.Wand size={14}/>
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-ink-900">Pedir personalizado</div>
              <div className="text-[12px] text-ink-600 leading-snug">Descreva o que quer. A IA aplica.</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// ---------- SmartImg: real B&W photographs with placeholder fallback ----------
// Uses picsum.photos (stable, public) with ?grayscale to keep the palette neutral.
// If the network/CDN fails, we fall back to the striped Placeholder so design
// never breaks.
const SmartImg = ({ seed, src, w = 800, h = 500, tone = 'warm', label, className = '', children, eager = false }) => {
  const [failed, setFailed] = useState(false);
  if (failed || (!seed && !src)) {
    return <Placeholder tone={tone} label={label} className={className}>{children}</Placeholder>;
  }
  const url = src || `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}?grayscale`;
  return (
    <div className={`relative overflow-hidden bg-ink-200 ${className}`}>
      <img src={url} onError={() => setFailed(true)}
           className="absolute inset-0 w-full h-full object-cover img-grayscale transition-transform duration-700 hover:scale-[1.04]"
           loading={eager ? 'eager' : 'lazy'} alt={label || ''}/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 pointer-events-none"/>
      {label && (
        <div className="absolute left-3 bottom-3 text-[10px] tracking-[0.14em] uppercase text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          {label}
        </div>
      )}
      {children}
    </div>
  );
};

// ---------- Drawer (right-side slide-in) ----------
const Drawer = ({ open, onClose, title, eyebrow, children, footer, width = 520 }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm fade-up" onClick={onClose}/>
      <div className="relative bg-paper border-l hairline shadow-pop h-full flex flex-col slide-right"
           style={{ width: `${width}px`, maxWidth: '92vw' }}>
        <div className="flex items-start justify-between px-6 py-5 border-b hairline shrink-0">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="label mb-1">{eyebrow}</div>}
            <div className="text-[17px] font-medium text-ink-900 tracking-tight truncate">{title}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink-100 text-ink-600 -mr-1 -mt-1">
            <Icon.X size={16}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t hairline px-6 py-4 flex items-center justify-end gap-2 bg-canvas shrink-0">{footer}</div>}
      </div>
    </div>
  );
};

Object.assign(window, {
  Placeholder, Button, Tag, Card, Modal, Drawer, SmartImg,
  ToastCtx, ToastProvider, useToast,
  Sidebar, Topbar, SectionHeader,
  CmdPalette, Stat, TabRow,
  OptimizeMenu, OPTIMIZE_MODES,
});

export {
  Placeholder,
  Button,
  Tag,
  Card,
  Modal,
  Drawer,
  SmartImg,
  ToastProvider,
  useToast,
  Sidebar,
  Topbar,
  SectionHeader,
  CmdPalette,
  Stat,
  TabRow,
  OptimizeMenu,
  OPTIMIZE_MODES,
};
