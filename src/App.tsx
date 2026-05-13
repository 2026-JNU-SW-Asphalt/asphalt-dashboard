import { FilterProvider } from './contexts/FilterContext';
import { IncidentsProvider } from './contexts/IncidentsContext';
import Header from './components/Header/Header';
import StatsBar from './components/StatsBar/StatsBar';
import MapView from './components/MapView/MapView';
import FilterPanel from './components/FilterPanel/FilterPanel';
import styles from './App.module.scss';

function App() {
  return (
    <FilterProvider>
      <IncidentsProvider>
        <div className={styles.app}>
          <Header />
          <StatsBar />
          <main className={styles.main}>
            <MapView />
            <FilterPanel />
          </main>
        </div>
      </IncidentsProvider>
    </FilterProvider>
  );
}

export default App;
