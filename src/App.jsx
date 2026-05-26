// App shell — routes, sidebar, keyboard shortcuts.

const App = () => {
  const [route, setRoute] = useState('home');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [planKickoff, setPlanKickoff] = useState(null);
  const [expertToOpen, setExpertToOpen] = useState(null);
  // Which trip is currently active in the Plan screen. Default is the Portugal
  // trip; switches to Disney when the Home wizard completes.
  const [activeTripId, setActiveTripId] = useState('trip-lisboa-porto');
  const activeTrip = activeTripId === 'trip-disney' ? mockData.disneyTrip : mockData.trip;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep top of new screen scrolled to top
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  const screen = (() => {
    switch (route) {
      case 'home':    return <HomeScreen    setRoute={setRoute} kickoffPlan={(t) => setPlanKickoff(t)} setActiveTripId={setActiveTripId} />;
      case 'plan':    return <PlanScreen    setRoute={setRoute} kickoff={planKickoff} clearKickoff={() => setPlanKickoff(null)} trip={activeTrip} />;
      case 'wallet':  return <WalletScreen  setRoute={setRoute} />;
      case 'miles':   return <MilesScreen   setRoute={setRoute} />;
      case 'experts': return <ExpertsScreen setRoute={setRoute} initialOpen={expertToOpen} clearInitialOpen={() => setExpertToOpen(null)} />;
      case 'explore': return <ExploreScreen setRoute={setRoute} openExpertProfile={(id) => setExpertToOpen(id)} />;
      case 'trips':   return <TripsScreen   setRoute={setRoute} />;
      case 'flights': return <FlightsScreen setRoute={setRoute} />;
      case 'hotels':  return <HotelsScreen  setRoute={setRoute} />;
      case 'tours':   return <ToursScreen   setRoute={setRoute} />;
      case 'plans':   return <PlansScreen   setRoute={setRoute} />;
      default:        return <HomeScreen    setRoute={setRoute} />;
    }
  })();

  return (
    <ToastProvider>
      <div className="flex bg-canvas">
        <Sidebar route={route} setRoute={setRoute} openCmd={() => setCmdOpen(true)}/>
        <main className="flex-1 min-w-0">
          {screen}
        </main>
      </div>
      <CmdPalette open={cmdOpen} onClose={() => setCmdOpen(false)} setRoute={setRoute}/>
    </ToastProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
