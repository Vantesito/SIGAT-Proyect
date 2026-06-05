import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Login from './Login';
import Mapa from './Mapa';
import Registro from './Registro';
import PanelAdmin from './PanelAdmin';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: portal informativo institucional */}
        <Route path="/" element={<Landing />} />
        
        {/* Ruta de acceso: solo para personal autorizado */}
        <Route path="/login" element={<Login />} />

        {/* Ruta del mapa: solo accesible después de login */}
        <Route path="/mapa" element={<Mapa />} />

        {/* Ruta de registro: solo para demo, no es parte del producto final */}
        <Route path="/registro" element={<Registro />} />

        {/* Ruta de panel de administración: Autorización usuarios, etc */}
        <Route path="/panel-admin" element={<PanelAdmin />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;