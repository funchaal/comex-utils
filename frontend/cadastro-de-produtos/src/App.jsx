import { useState, useRef, useEffect, useContext } from 'react'
import './App.css'

import { Routes, Route, Link } from "react-router-dom";

import { AuthProvider, AuthContext } from './AuthContext';

import { Uploader, Input, Button, CustomProvider } from 'rsuite'
import 'rsuite/dist/rsuite.min.css';

import Home from './pages/Home';
import GerarPlanilha from './pages/gerarPlanilha';

import Header from './components/Header'
import Menu from './components/Menu'

function App() {

  useEffect(() => {
    document.title = 'Catálogo de Produtos'
  }, [])

  return (
    <div className='App'>
    <AuthProvider>
    <CustomProvider theme='dark'>
      <Header />
      <Menu />
      <div className='main'>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/gerar-planilha" element={<GerarPlanilha />} index/>
        </Routes>
      </div>
    </CustomProvider>
    </AuthProvider>
    </div>
  )
}

export default App
