import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Login from './pages/Login'
import Admin from './pages/Admin';
import Doctor from './pages/Doctor'
import Patient from './pages/Patient'
import Create from './pages/Create';
import Init from './pages/Init';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/create" element={<Create />} />
          <Route path="/init" element={<Init />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/doctor" element={<Doctor />} />
          <Route path="/patient" element={<Patient />} />
        </Routes>
      </Router>
    </>
  )
}

export default App