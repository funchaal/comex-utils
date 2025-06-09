import { useState, useRef, useEffect, useContext } from 'react'
import './App.css'

import { Routes, Route, Link } from "react-router-dom";

import { AuthProvider, AuthContext } from './AuthContext';

import { Uploader, Input, Button, CustomProvider } from 'rsuite'
import 'rsuite/dist/rsuite.min.css';

import Home from './pages/Home';
import GerarPlanilha from './pages/gerarPlanilha';
import ConsultProducts from './pages/consultProducts';

import Header from './components/Header'
import Menu from './components/Menu'
import PostProducts from './pages/postProducts';
import PostOperators from './pages/postOperators';
import ConsultOperators from './pages/consultOperators';
import PostLinks from './pages/postLinks';

function App() {

  useEffect(() => {
    document.title = 'Comex Utils'
  }, [])

  return (
    <div className='App'>
    <AuthProvider>
    <CustomProvider theme='light'>
      <Header />
      {/* <Menu /> */}
      <div className='main'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gerar-planilha" element={<GerarPlanilha />}/>
          <Route path="/consultar-produtos" element={<ConsultProducts />}/>
          <Route path="/consultar-operadores" element={<ConsultOperators />}/>
          <Route path="/cadastrar-produtos" element={<PostProducts />}/>
          <Route path="/cadastrar-operadores" element={<PostOperators />}/>
          <Route path="/linkar-produtos" element={<PostLinks />}/>
        </Routes>
      </div>
    </CustomProvider>
    </AuthProvider>
    </div>
  )
}

export default App
