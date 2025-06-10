import React, { useState, useEffect } from 'react';
import { Button } from 'rsuite';
import Input from '../components/Input';



// utils/config.js
export const HOST = import.meta.env.MODE === 'production'
  ? 'https://comex-utils.onrender.com'
  : 'http://127.0.0.1:5000';
;

function ConsultOperators() {
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [responseTitle, setResponseTitle] = useState('Nenhuma resposta por enquanto.');
    const [responseClass, setResponseClass] = useState('');
    const [results, setResults] = useState({
        status: null,
    });

    useEffect(() => {
        if (results.status) {
            if (results.status === 200) {
                setResponseClass('ok');
            } else {
                setResponseClass('error');
            }
        } else {
            setResponseClass('');
        }
    }, [results]);

    async function handleSubmit() {
        try {
            setLoading(true);

            const url = new URL(HOST + '/consult-operators');

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
            setResponseClass('error');
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
            link.setAttribute('download', 'consult_operators.xlsx');
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar o arquivo:', error);
            setResponseTitle('Erro ao baixar o arquivo.');
            setResponseClass('error');
        }
    }
    return (
        <div id='post-operators' className='main-container'>
            <div className='input-container'>
                <h1>Consultar operadores estrangeiros</h1>
                    <h2>Consultar operadores cadastrados.</h2>
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
            
            <div className={`response-container ${responseClass}`}>
                <p>{ responseTitle }</p>
                {/* <JsonCardViwer data={results.content} /> */}
            </div>
        </div>
    );
}

export default ConsultOperators;
