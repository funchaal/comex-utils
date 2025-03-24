import React from 'react';

import { Link } from 'react-router-dom';
import { Button } from 'rsuite';

function Home() {
    return (
        <div>
            <h1>Catálogo de produtos</h1>
            <h2>Escolha uma funcionalidade</h2>
            {/* <nav>
                <Button>
                    <Link to="/consultar-produtos" className='link'>
                        <p className='title'>Consultar produtos</p>
                        <p className='description'>Consulte produtos já cadastrados do sistema.</p>
                    </Link>
                </Button>
                <Button>
                    <Link to="/gerar-planilha" className='link'>
                        <p className='title'>Gerar planilha</p>
                        <p className='description'>Gere a planilha para preenchimento dos atributos.</p>
                    </Link>
                </Button>
                <Button>
                    <Link to="/cadastrar-produtos" className='link'>
                        <p className='title'>Consultar produtos</p>
                        <p className='description'>Consulte produtos já cadastrados do sistema.</p>
                    </Link>
                </Button>
                <Button>
                    <Link to="/cadastrar-oes" className='link'>
                        <p className='title'>Consultar produtos</p>
                        <p className='description'>Consulte produtos já cadastrados do sistema.</p>
                    </Link>
                </Button>
                <Button>
                    <Link to="/linkar-produtos" className='link'>
                        <p className='title'>Consultar produtos</p>
                        <p className='description'>Consulte produtos já cadastrados do sistema.</p>
                    </Link>
                </Button>
            </nav> */}
        </div>
    );
};

export default Home;