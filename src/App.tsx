import { HashRouter } from 'react-router-dom';
import RootNavigator from './navigation/RootNavigator';

/**
 * App — root entry point.
 * Delegates all routing to RootNavigator.
 */
function App() {
  return (
    <HashRouter>
      <RootNavigator />
    </HashRouter>
  );
}

export default App;
