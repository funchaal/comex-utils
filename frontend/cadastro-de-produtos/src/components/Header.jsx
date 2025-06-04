import React, { useState, useContext, useEffect } from 'react'
import CertificateContainer from './CertificateContainer'
import Menu from './Menu'
import { AuthContext } from '../AuthContext'

function Header() {
  const { certificate } = useContext(AuthContext)

  const [certificateShow, setCertificateShow] = useState(false)
  const [certificateName, setCertificateName] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setCertificateName(certificate?.name)
  }, [certificate])

   const handleToggle = () => setCertificateShow(prev => !prev)

  const toggleMenu = () => setMenuOpen(prev => !prev)

  return (
    <>
      <header className="header">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="header-title-container">
          <button onClick={toggleMenu} className={`menu-toggle-btn ${menuOpen ? 'open' : ''}`}><div></div><div></div><div></div></button>
          <h1 className="header-title">Comex Utils</h1>
        </div>

         <div className="header-button-container">
        <button onClick={handleToggle} className={`header-cert-btn ${certificateShow ? 'hidden' : 'visible'} ${ isAuthenticated ? 'authenticated' : ''}`}>
          {certificateName || 'Selecionar certificado'}
        </button>

        <button onClick={handleToggle} style={{ fontSize: '1.2rem' }} className={`x header-close-btn ${certificateShow ? 'visible' : 'hidden'} ${ isAuthenticated ? 'authenticated' : ''}`}>
          ✕
        </button>
        </div>
      </header>


      <CertificateContainer
        show={certificateShow}
        onClose={() => setCertificateShow(false)}
      />
    </>
  )
}

export default Header
