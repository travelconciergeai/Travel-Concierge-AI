import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../icons.jsx";
import { mockData } from "../mockData.jsx";
import { getStoredHotelSearchResults, subscribeHotelSearchResults } from "../lib/hotelSearchState.js";
import { applyHotelToProgressiveTrip } from "../lib/tripDraftState.js";
import { isMockDataMode, isRealDataMode } from "../lib/dataMode.js";
import { Placeholder, Button, Card, Drawer, Modal, OptimizeMenu, SectionHeader, SmartImg, Stat, TabRow, Tag, Topbar, useToast } from "../ui.jsx";

// Hotels — Voya Collection editorial.

const HotelsScreen = ({ setRoute, setActiveTripId }) => {
  const [open, setOpen] = useState(null);
  const [searchHotels, setSearchHotels] = useState(() => getStoredHotelSearchResults());
  const toast = useToast();
  const hotels = searchHotels.length ? searchHotels : (isMockDataMode() ? mockData.hotels : []);

  useEffect(() => subscribeHotelSearchResults(setSearchHotels), []);

  const openBooking = (hotel) => {
    if (hotel.bookingUrl) {
      window.open(hotel.bookingUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    toast({title:'Reserva enviada', tone:'success', desc:`${hotel.name} · ${hotel.nights} noites`});
  };

  const applyToTrip = (hotel) => {
    const trip = applyHotelToProgressiveTrip(hotel);
    if (!trip) {
      toast({ title: 'Hotel não aplicado', desc: 'Use um resultado real antes de criar o roteiro.', tone: 'info' });
      return;
    }
    setActiveTripId?.(trip.id);
    toast({
      title: 'Hotel aplicado ao roteiro',
      tone: 'success',
      desc: 'Voos, passeios e dias ficaram prontos para completar.',
    });
    setRoute('plan');
  };

  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Hotéis" title="Voya Collection"
        right={<><Button variant="ghost" icon={Icon.Filter}>Filtros</Button>
                  <Button variant="secondary" icon={Icon.MapPin}>Mapa</Button></>}/>

      <div className="px-10 pb-12 grid grid-cols-3 gap-5">
        {isRealDataMode() && !hotels.length && (
          <Card className="col-span-3 p-6">
            <div className="text-[14px] font-medium text-ink-900">Nenhum hotel real carregado ainda.</div>
            <div className="text-[12.5px] text-ink-500 mt-1">Peça uma busca no chat para consultar o provider real.</div>
          </Card>
        )}
        {hotels.map(h => (
          <Card key={h.id} hover className="overflow-hidden" onClick={() => setOpen(h)}>
            <SmartImg seed={`hotel-${h.id}`} src={h.image} tone={h.tone} label={h.city} w={600} h={400} className="h-[200px]"/>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <Tag tone="gold">{h.tag}</Tag>
                <div className="text-[12px] text-ink-700 inline-flex items-center gap-1"><Icon.Star size={11}/> {h.rating}{h.reviewCount ? ` · ${h.reviewCount.toLocaleString('pt-BR')}` : ''}</div>
              </div>
              <div className="text-[16px] font-medium text-ink-900 mt-3">{h.name}</div>
              <div className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-1.5"><Icon.MapPin size={11}/> {h.city}</div>
              <div className="text-[12px] text-sage-700 mt-3 flex items-center gap-1.5"><Icon.Sparkles size={11}/> {h.perk}</div>
              <div className="mt-4 pt-4 border-t hairline flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11.5px] text-ink-500">por noite</div>
                  <div className="text-[16px] font-medium text-ink-900">{h.nightlyRate}</div>
                  {h.totalRate && <div className="text-[11.5px] text-ink-500 mt-0.5">{h.totalRate} total</div>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    disabled={!h.bookingUrl}
                    onClick={(event) => { event.stopPropagation(); if (h.bookingUrl) openBooking(h); }}
                    className={`h-8 px-3 rounded-full text-[12px] font-medium inline-flex items-center justify-center gap-1.5 ${
                      h.bookingUrl ? 'bg-ink-900 text-paper hover:bg-ink-800' : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                    }`}>
                    <Icon.ArrowUpRight size={11}/> Reservar
                  </button>
                  <button
                    onClick={(event) => { event.stopPropagation(); applyToTrip(h); }}
                    className="h-8 px-3 rounded-full border-half bg-white text-[12px] text-ink-800 hover:bg-ink-50 inline-flex items-center justify-center gap-1.5">
                    <Icon.Check size={11}/> Aplicar ao roteiro
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!open} onClose={()=>setOpen(null)} size="lg" title={open?.name || ''}
        footer={open && <>
          <Button variant="ghost" onClick={()=>setOpen(null)}>Fechar</Button>
          <Button icon={Icon.Heart} variant="secondary">Salvar</Button>
          <Button icon={Icon.Check} variant="secondary" onClick={()=>{applyToTrip(open); setOpen(null);}}>
            Aplicar ao roteiro
          </Button>
          {open.bookingUrl && <Button icon={Icon.ArrowUpRight} onClick={()=>{openBooking(open); setOpen(null);}}>
            Reservar
          </Button>}
        </>}>
        {open && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <SmartImg seed={`hotel-cover-${open.id}`} src={open.image} tone={open.tone} label={open.city} w={600} h={400} className="h-[200px] rounded-xl"/>
              <div className="grid grid-cols-2 gap-3">
                <SmartImg seed={`hotel-${open.id}-1`} tone="warm" w={400} h={400} className="rounded-xl aspect-square"/>
                <SmartImg seed={`hotel-${open.id}-2`} tone="cool" w={400} h={400} className="rounded-xl aspect-square"/>
                <SmartImg seed={`hotel-${open.id}-3`} tone="sage" w={400} h={400} className="rounded-xl aspect-square"/>
                <SmartImg seed={`hotel-${open.id}-4`} tone="coral" w={400} h={400} className="rounded-xl aspect-square"/>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Mini3 label="Avaliação" value={`${open.rating} ★`} tone="sage"/>
              <Mini3 label="Noites" value={open.nights}/>
              <Mini3 label="Noite" value={open.nightlyRate}/>
              <Mini3 label="Total" value={open.totalRate || open.price}/>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex gap-3">
              <Icon.Sparkles size={16} className="text-brand-700 mt-0.5"/>
              <div className="text-[13px] text-brand-900">
                <span className="font-medium">Motivo da recomendação:</span> {open.perk}.
              </div>
            </div>
            <div>
              <div className="label mb-2">O hotel</div>
              <p className="text-[13.5px] text-ink-700 leading-relaxed">
                Resultado do provider {open.provider || 'conectado'} com dados reais de imagem, preço, avaliação e link quando disponíveis.
                Ao aplicar ao roteiro, ele vira a primeira peça confirmada da viagem progressiva.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

window.HotelsScreen = HotelsScreen;
export { HotelsScreen };
