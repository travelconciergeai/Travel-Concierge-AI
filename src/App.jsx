// App shell — routes, sidebar, keyboard shortcuts.
import React, { useEffect, useState } from 'react';
import { mockData } from './mockData.jsx';
import { isRealDataMode } from './lib/dataMode.js';
import { getStoredTripById, getStoredTrips, subscribeTrips } from './lib/tripDraftState.js';
import { CmdPalette, Sidebar, ToastProvider } from './ui.jsx';
import { HomeScreen } from './screens/HomeScreen.jsx';
import { PlanScreen } from './screens/PlanScreen.jsx';
import { WalletScreen } from './screens/WalletScreen.jsx';
import { MilesScreen } from './screens/MilesScreen.jsx';
import { ExpertsScreen } from './screens/ExpertsScreen.jsx';
import { ExploreScreen } from './screens/ExploreScreen.jsx';
import { TripsScreen } from './screens/TripsScreen.jsx';
import { FlightsScreen } from './screens/FlightsScreen.jsx';
import { HotelsScreen } from './screens/HotelsScreen.jsx';
import { ToursScreen } from './screens/ToursScreen.jsx';
import { PlansScreen } from './screens/PlansScreen.jsx';

const App = () => {
  const [route, setRoute] = useState('home');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [planKickoff, setPlanKickoff] = useState(null);
  const [expertToOpen, setExpertToOpen] = useState(null);
  // Which trip is currently active in the Plan screen. Default is the Portugal
  // trip; switches to Disney when the Home wizard completes.
  const [activeTripId, setActiveTripId] = useState('trip-lisboa-porto');
  const [realTrips, setRealTrips] = useState(() => (isRealDataMode() ? getStoredTrips() : []));
  const activeTrip = isRealDataMode()
    ? getStoredTripById(activeTripId) || realTrips.find(Boolean) || null
    : activeTripId === 'trip-disney' ? mockData.disneyTrip : mockData.trip;

  useEffect(() => {
    if (!isRealDataMode()) return undefined;
    const syncTrips = (trips) => {
      setRealTrips(trips);
      if (!activeTripId || activeTripId === 'trip-lisboa-porto') {
        setActiveTripId(trips[0]?.id || 'trip-lisboa-porto');
      }
    };
    syncTrips(getStoredTrips());
    return subscribeTrips(syncTrips);
  }, [activeTripId]);

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
      case 'trips':   return <TripsScreen   setRoute={setRoute} setActiveTripId={setActiveTripId} />;
      case 'flights': return <FlightsScreen setRoute={setRoute} />;
      case 'hotels':  return <HotelsScreen  setRoute={setRoute} setActiveTripId={setActiveTripId} />;
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

export default App;
