// Tours / Experiences — curated.

const ToursScreen = ({ setRoute }) => {
  const toast = useToast();
  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Passeios" title="Experiências curadas"
        right={<Button variant="secondary" icon={Icon.Sparkles}>Pedir personalizado</Button>}/>

      <div className="px-10 pb-12 grid grid-cols-3 gap-5">
        {mockData.tours.map(t => (
          <Card key={t.id} hover className="overflow-hidden">
            <SmartImg seed={`tour-${t.id}`} tone={t.tone} label={t.city} w={600} h={400} className="h-[180px]"/>
            <div className="p-5">
              <Tag tone="brand"><Icon.Sparkles size={10}/> curado</Tag>
              <div className="text-[15.5px] font-medium text-ink-900 mt-3 leading-snug">{t.name}</div>
              <div className="text-[12px] text-ink-500 mt-1 flex items-center gap-2">
                <Icon.MapPin size={11}/>{t.city}<span className="text-ink-300">·</span>
                <Icon.Clock size={11}/>{t.dur}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-700">
                <Placeholder tone="warm" className="h-6 w-6 rounded-full"/> Host: {t.host}
              </div>
              <div className="mt-4 pt-4 border-t hairline flex items-center justify-between">
                <div className="text-[16px] font-medium text-ink-900">{t.price}</div>
                <Button size="sm" icon={Icon.Plus} onClick={() => toast({title:'Adicionado ao roteiro', tone:'success', desc:t.name})}>Adicionar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

window.ToursScreen = ToursScreen;
