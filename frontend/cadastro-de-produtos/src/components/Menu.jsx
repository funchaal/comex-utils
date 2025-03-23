import React from 'react';
import { useState, useRef, useEffect, useContext } from 'react'

import { Routes, Route, Link } from "react-router-dom";

function Menu() {
  return (
    <div className='menu-container'>
      <nav>
        <ul>
          <li><Link to='/gerar-planilha' className='link'>Gerar Planilha</Link></li>
        </ul>
      </nav>
    </div>
  )
}

export default Menu;