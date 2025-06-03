import React, { useState, useContext, useEffect } from 'react'
import { Button } from 'rsuite'
import CertificateContainer from './CertificateContainer'

import { AuthContext } from '../AuthContext'

function Header() {
  const { certificate } = useContext(AuthContext)

  const [certificateShow, setCertificateShow] = useState(false)
  const [certificateName, setCertificateName] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setCertificateName(certificate?.name)
  }, [certificate])

  const handleToggle = () => setCertificateShow(prev => !prev)

  return (
    <header className="header">
      <div className="header-button-container">
        <button onClick={handleToggle} className={`header-cert-btn ${certificateShow ? 'hidden' : 'visible'} ${ isAuthenticated ? 'authenticated' : ''}`}>
          {certificateName || 'Selecionar certificado'}
        </button>

        <button onClick={handleToggle} className={`x header-close-btn ${certificateShow ? 'visible' : 'hidden'} ${ isAuthenticated ? 'authenticated' : ''}`}>
          ✕
        </button>
      </div>

      <CertificateContainer
        show={certificateShow}
        onClose={() => setCertificateShow(false)}
      />
    </header>
  )
}

export default Header
