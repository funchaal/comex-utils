import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Menu({ isOpen, onClose }) {
  const location = useLocation()

  return (
    <div className={`menu-container ${isOpen ? 'open' : ''}`}>
      <nav>
            <Link
              to='/gerar-planilha'
              className={`link ${location.pathname === '/gerar-planilha' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Gerar Planilha
            </Link>

            <Link
              to='/cadastrar-produtos'
              className={`link ${location.pathname === '/cadastrar-produtos' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Cadastrar Produtos
            </Link>

            <Link
              to='/consultar-produtos'
              className={`link ${location.pathname === '/consultar-produtos' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Consultar Produtos
            </Link>
      </nav>
    </div>
  )
}

export default Menu
