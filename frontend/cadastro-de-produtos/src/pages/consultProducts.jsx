import React, { useState, useEffect } from 'react';
import { Button } from 'rsuite';
import Input from '../components/Input';

const prod = true;

const HOST = prod ? 'https://comex-utils.onrender.com' : 'http://127.0.0.1:5000';

function ConsultProducts() {
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [responseTitle, setResponseTitle] = useState('Nenhuma resposta por enquanto.');
    const [responseColor, setResponseColor] = useState('neutral');
    const [results, setResults] = useState({
        status: null,
    });

    useEffect(() => {
        if (results.status) {
            if (results.status === 200) {
                setResponseColor('ok');
            } else {
                setResponseColor('error');
            }
        } else {
            setResponseColor('neutral');
        }
    }, [results]);

    async function handleSubmit() {
        try {
            setLoading(true);

            const url = new URL(HOST + '/consult-products');

            // Obtendo session-id do cookie
            const sessionId = document.cookie
                .split('; ')
                .find(row => row.startsWith('session-id='))
                ?.split('=')[1];

            console.log(sessionId)

            // Adiciona inputValue como parâmetro de URL
            url.searchParams.append('cpfCnpjRaiz', inputValue);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'session-id': sessionId || ''
                }
                // Não usar `body` em GET!
            });

            const status = response.status;

            setResults({ status });

            if (status === 200) {
                const file = await response.blob();
                handleDownload(file);
                setResponseTitle('Arquivo gerado e baixado com sucesso.');
            } else {
                setResponseTitle('Ocorreu um erro ao gerar o arquivo.');
            }

        } catch (error) {
            console.error('Erro ao enviar requisição:', error);
            setResponseTitle('Erro inesperado ao enviar a consulta.');
            setResponseColor('error');
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(response) {
        try {
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'consult_products.xlsx');
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar o arquivo:', error);
            setResponseTitle('Erro ao baixar o arquivo.');
            setResponseColor('error');
        }
    }

    return (
        <div id='gerar-planilha'>
            <div className="central-container">
                <div className='input-container'>
                    <h1>Consultar produtos</h1>
                    <h2>Consultar produtos cadastrados.</h2>
                    <br /><br />
                    <Input 
                        type='text' 
                        label="CPF / CNPJ Raíz" 
                        style={{ maxWidth: 400 }}
                        value={inputValue}
                        onChange={(value) => setInputValue(value)}
                    />
                    <br />

                    <Button
                        size='lg'
                        color='pink'
                        appearance="primary"
                        style={{ float: 'right' }}
                        onClick={handleSubmit}
                        className='upload-button'
                        loading={loading}
                        disabled={!inputValue}
                    >
                        Enviar
                    </Button>
                </div>

                <br />
                <div className={`response-container ${responseColor}`}>
                    <p>{responseTitle}</p>
                </div>
            </div>
        </div>
    );
}

export default ConsultProducts;
