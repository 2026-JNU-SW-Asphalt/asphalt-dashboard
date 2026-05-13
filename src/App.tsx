import { FilterProvider } from './contexts/FilterContext';
import { IncidentsProvider } from './contexts/IncidentsContext';
import { SelectedIncidentProvider } from './contexts/SelectedIncidentContext';
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
          <div className={styles.app}>
            <Header />
            <StatsBar />
            <main className={styles.main}>
              <MapView />
              <FilterPanel />
            </main>
          </div>
          {/* 포트홀 상세 팝업 (전역 — selectedId가 있을 때만 렌더) */}
          <IncidentDetailModal />
        </SelectedIncidentProvider>
      </IncidentsProvider>
    </FilterProvider>
  );
}

export default App;
