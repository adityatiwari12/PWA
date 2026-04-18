import { BrowserRouter } from 'react-router-dom';
import RootNavigator from './navigation/RootNavigator';

/**
 * App — root entry point.
 * Delegates all routing to RootNavigator.
 */
function App() {
  return (
    <BrowserRouter>
      <RootNavigator />
    </BrowserRouter>
  );
}

export default App;
