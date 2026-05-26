// My Trips — list across states: active, planning, idea, completed.

const TripsScreen = ({ setRoute }) => {
  const [filter, setFilter] = useState('todas');
  const list = mockData.trips.filter(t => filter === 'todas' || mapState(t.state) === filter);

  return (
    <div className="min-h-screen">
      <Topbar subtitle="Voya · Suas viagens" title="Minhas viagens"
        right={<Button variant="secondary" icon={Icon.Plus} onClick={() => setRoute('plan')}>Nova viagem</Button>}/>

      <div className="px-10">
        <TabRow
          value={filter} onChange={setFilter}
          tabs={[
            { id: 'todas', label: 'Todas' },
            { id: 'ativas', label: 'Ativas' },
            { id: 'plan', label: 'Em planejamento' },
            { id: 'ideias', label: 'Ideias' },
            { id: 'feitas', label: 'Concluídas' },
          ]}
          className="mb-6"
        />
      </div>

      <div className="px-10 pb-12 grid grid-cols-2 gap-5">
        {list.map(t => (
          <Card key={t.id} hover className="overflow-hidden" onClick={() => setRoute('plan')}>
            <div className="grid grid-cols-[200px_1fr]">
              <SmartImg seed={`trip-${t.id}`} tone={t.tone} label={t.cover} w={400} h={400} className="min-h-[180px]"/>
              <div className="p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <Tag tone={mapState(t.state) === 'ativas' ? 'sage' : mapState(t.state) === 'feitas' ? 'ink' : 'brand'}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current"/> {t.state}
                  </Tag>
                  <button className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500"><Icon.MoreH size={14}/></button>
                </div>
                <div className="text-[17px] font-medium tracking-tight text-ink-900 mt-3 leading-snug">{t.title}</div>
                <div className="text-[12.5px] text-ink-500 mt-1">{t.dates} · {t.travelers} viajantes</div>

                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-[11.5px] text-ink-500 mb-1.5">
                    <span>Progresso</span><span>{t.progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full bg-ink-900 transition-all" style={{ width: `${t.progress}%` }}/>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="px-10 pb-16">
        <Card className="p-6 bg-ink-50/60 border-dashed">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white border hairline flex items-center justify-center"><Icon.Sparkles size={18} className="text-brand-600"/></div>
            <div className="flex-1">
              <div className="text-[15px] font-medium text-ink-900">Voya pode planejar uma viagem-surpresa pra 2027</div>
              <div className="text-[12.5px] text-ink-600 mt-0.5">Diga só o orçamento e a vibe. Te enviamos 3 propostas curadas em 24h.</div>
            </div>
            <Button onClick={() => setRoute('plan')}>Começar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

function mapState(s) {
  if (s === 'Roteiro vivo') return 'ativas';
  if (s === 'Em planejamento') return 'plan';
  if (s === 'Idéia') return 'ideias';
  if (s === 'Concluído') return 'feitas';
  return 'todas';
}

window.TripsScreen = TripsScreen;
