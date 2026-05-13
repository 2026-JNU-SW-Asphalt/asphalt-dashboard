import { FilterProvider } from './contexts/FilterContext';
import { IncidentsProvider } from './contexts/IncidentsContext';
import { SelectedIncidentProvider } from './contexts/SelectedIncidentContext';
import { HoveredIncidentProvider } from './contexts/HoveredIncidentContext';
import Header from './components/Header/Header';
import StatsBar from './components/StatsBar/StatsBar';
import MapView from './components/MapView/MapView';
import FilterPanel from './components/FilterPanel/FilterPanel';
import IncidentDetailModal from './components/Modals/IncidentDetailModal';
import styles from './App.module.scss';

function App() {
  return (
    <FilterProvider>
      <IncidentsProvider>
        <SelectedIncidentProvider>
          <HoveredIncidentProvider>
            <div className={styles.app}>
              <Header />
              <StatsBar />
              <main className={styles.main}>
                <MapView />
                <FilterPanel />
              </main>
            </div>
            <IncidentDetailModal />
          </HoveredIncidentProvider>
        </SelectedIncidentProvider>
      </IncidentsProvider>
    </FilterProvider>
  );
}

export default App;
