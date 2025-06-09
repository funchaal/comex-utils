import React from 'react';

import { Link } from 'react-router-dom';

function Home() {
    return (
        <div id='home'>
            <h1>Comex Utils</h1>
            <h2>Escolha uma funcionalidade</h2>
            <nav>
                <button>
                    <Link to="/gerar-planilha" className='link'>
                            <p className='title'>Gerar planilha</p>
                    </Link>
                </button>
                <button>
                    <Link to="/consultar-produtos" className='link'>
                            <p className='title'>Consultar produtos</p>
                    </Link>
                </button>
                <button>
                    <Link to="/consultar-operadores" className='link'>
                            <p className='title'>Consultar Operadores</p>
                    </Link>
                </button>
                <button>
                    <Link to="/cadastrar-produtos" className='link'>
                            <p className='title'>Cadastrar produtos</p>
                    </Link>
                </button>
                <button>
                    <Link to="/cadastrar-operadores" className='link'>
                            <p className='title'>Cadastrar Operadores</p>
                    </Link>
                </button>
                <button>
                    <Link to="/linkar-produtos" className='link'>
                            <p className='title'>Linkar produtos</p>
                    </Link>
                </button>
            </nav>
        </div>
    );
};

export default Home;