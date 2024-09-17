import './App.css';
import { NavBar } from './Components/NavBar';
import { Banner } from './Components/Banner';
import {Statistics} from './Components/Statistics';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
      <NavBar />
      <Banner />
      <Statistics/>
    </div>
  );
}

export default App;
