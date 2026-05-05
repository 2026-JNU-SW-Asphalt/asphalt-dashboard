import { FilterProvider } from './contexts/FilterContext';
import Header from './components/Header/Header';
import StatsBar from './components/StatsBar/StatsBar';
import MapView from './components/MapView/MapView';
import FilterPanel from './components/FilterPanel/FilterPanel';
import styles from './App.module.scss';

function App() {
  return (
    <FilterProvider>
      <div className={styles.app}>
        <Header />
        <StatsBar />
        <main className={styles.main}>
          <MapView />
          <FilterPanel />
        </main>
      </div>
    </FilterProvider>
  );
}

export default App;
