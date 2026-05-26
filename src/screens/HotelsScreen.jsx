// Hotels — Voya Collection editorial.

const HotelsScreen = ({ setRoute }) => {
  const [open, setOpen] = useState(null);
  const toast = useToast();
  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Hotéis" title="Voya Collection"
        right={<><Button variant="ghost" icon={Icon.Filter}>Filtros</Button>
                  <Button variant="secondary" icon={Icon.MapPin}>Mapa</Button></>}/>

      <div className="px-10 pb-12 grid grid-cols-3 gap-5">
        {mockData.hotels.map(h => (
          <Card key={h.id} hover className="overflow-hidden" onClick={() => setOpen(h)}>
            <SmartImg seed={`hotel-${h.id}`} tone={h.tone} label={h.city} w={600} h={400} className="h-[200px]"/>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <Tag tone="gold">{h.tag}</Tag>
                <div className="text-[12px] text-ink-700 inline-flex items-center gap-1"><Icon.Star size={11}/> {h.rating}</div>
              </div>
              <div className="text-[16px] font-medium text-ink-900 mt-3">{h.name}</div>
              <div className="text-[12px] text-ink-500 mt-0.5 flex items-center gap-1.5"><Icon.MapPin size={11}/> {h.city}</div>
              <div className="text-[12px] text-sage-700 mt-3 flex items-center gap-1.5"><Icon.Sparkles size={11}/> {h.perk}</div>
              <div className="mt-4 pt-4 border-t hairline flex items-center justify-between">
                <div className="text-[11.5px] text-ink-500">{h.nights} noites · total</div>
                <div className="text-[16px] font-medium text-ink-900">{h.price}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!open} onClose={()=>setOpen(null)} size="lg" title={open?.name || ''}
        footer={open && <>
          <Button variant="ghost" onClick={()=>setOpen(null)}>Fechar</Button>
          <Button icon={Icon.Heart} variant="secondary">Salvar</Button>
          <Button icon={Icon.Check} onClick={()=>{setOpen(null); toast({title:'Reserva enviada', tone:'success', desc:`${open.name} · ${open.nights} noites`});}}>
            Reservar
          </Button>
        </>}>
        {open && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <SmartImg seed={`hotel-cover-${open.id}`} tone={open.tone} label={open.city} w={600} h={400} className="h-[200px] rounded-xl"/>
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
              <Mini3 label="Total" value={open.price}/>
              <Mini3 label="Cancelamento" value="Grátis 48h" tone="sage"/>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex gap-3">
              <Icon.Sparkles size={16} className="text-brand-700 mt-0.5"/>
              <div className="text-[13px] text-brand-900">
                <span className="font-medium">Voya Perk:</span> {open.perk}. Aplicado automaticamente na sua reserva via Voya Signature.
              </div>
            </div>
            <div>
              <div className="label mb-2">O hotel</div>
              <p className="text-[13.5px] text-ink-700 leading-relaxed">Boutique premiado com vista para o rio. Spa, restaurante autoral e atendimento sob medida.
                Selecionado pessoalmente pela expert Inês Marçal, que reserva o quarto orientado para o pôr do sol pra você.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

window.HotelsScreen = HotelsScreen;
