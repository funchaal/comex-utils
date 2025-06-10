import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { Button, Uploader } from 'rsuite';
import Results from '../components/Results';

import JsonCardViwer from '../components/JsonCardViwer';



// utils/config.js
export const HOST = import.meta.env.MODE === 'production'
  ? 'https://comex-utils.onrender.com'
  : 'http://127.0.0.1:5000';


function PostProducts() {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [stage, setStage] = useState(0);
    const [responseTitle, setResponseTitle] = useState('Nenhuma resposta por enquanto.');
    const [responseClass, setResponseClass] = useState('');
    const [results, setResults] = useState({
        content: [], 
        status: null
    });

    useEffect(() => {
        if (results.status) {
            if (results.status === 200) {
                setResponseClass('ok')
            } else {
                setResponseClass('error')
            }
        } else {
            setResponseClass('');
        }
    }, [results]);

    async function handleUpload() {
        try {
            setLoading(true);

            const data = fileList[0].blobFile;
            const formData = new FormData();
            formData.append('file', data);

            const url = HOST + '/products-payload';

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const status = response.status;
            const content = await response.json();

            setResults({
                content: content,
                status: status
            });

            if (status === 200) {
                setResponseTitle('Verifique o payload gerado abaixo e confirme para enviar os produtos.');
                setStage(1)
            } else {
                setResponseTitle('Alguns erros ocorreram ao gerar o payload. Verifique os erros abaixo.');
            };

        } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirm() {
        try {
            setLoading(true);

            const payload = results.content;
            const url = HOST + '/post-products';

            // Obtendo session-id do cookie
            const sessionId = document.cookie
                .split('; ')
                .find(row => row.startsWith('session-id='))
                ?.split('=')[1];

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'session-id': sessionId || ''
                },
                body: JSON.stringify(payload)
            });

            const status = response.status;
            const content = await response.json();

            setResults({
                content: content,
                status: status
            });

            setResponseTitle('Verifique a resposta do servidor abaixo.');

            setStage(0);

        } catch (error) {
            console.error('Erro ao confirmar:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div id='post-operators' className='main-container'>
            <div className='input-container'>
                <h1>Cadastrar Produtos</h1>
                <h2>Cadastrar produtos no Portal Único.</h2>
                <div className="drop-file-container">
                    <Uploader
                        action=""
                        draggable
                        autoUpload={false}
                        multiple={false}
                        onChange={(fileList) => setFileList(fileList)}
                        >
                        <div className='drop-file'>
                            <p>Click or Drag files to this area to upload</p>
                        </div>
                    </Uploader>
                </div>

                <br />

                <Button
                    size='lg'
                    color='pink'
                    appearance="primary"
                    style={{ float: 'right' }}
                    onClick={() => { stage === 0 ? handleUpload() : handleConfirm() }}
                    className='upload-button'
                    loading={loading}
                    disabled={
                        fileList.length === 0 ||
                        (stage === 1 && results.status !== 200)
                        }
                    >
                    {stage === 0 ? 'Upload' : 'Confirmar'}
                </Button>
            </div>

            <br />
            
            <div className={`response-container ${responseClass}`}>
                <p>{ responseTitle }</p>
                <JsonCardViwer data={results.content} />
            </div>
        </div>
    );
}

export default PostProducts;
