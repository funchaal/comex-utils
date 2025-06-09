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
              to='/consultar-produtos'
              className={`link ${location.pathname === '/consultar-produtos' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Consultar Produtos
            </Link>

            <Link
              to='/consultar-operadores'
              className={`link ${location.pathname === '/consultar-operadores' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Consultar Operadores
            </Link>

            <Link
              to='/cadastrar-produtos'
              className={`link ${location.pathname === '/cadastrar-produtos' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Cadastrar Produtos
            </Link>

            <Link
              to='/cadastrar-operadores'
              className={`link ${location.pathname === '/cadastrar-operadores' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Cadastrar Operadores
            </Link>

            <Link
              to='/linkar-produtos'
              className={`link ${location.pathname === '/linkar-produtos' ? 'active' : ''}`}
              // onClick={onClose}
            >
              Linkar Produtos
            </Link>

      </nav>
    </div>
  )
}

export default Menu
