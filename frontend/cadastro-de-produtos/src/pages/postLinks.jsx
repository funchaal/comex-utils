import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';
import { Button, Uploader } from 'rsuite';
import Results from '../components/Results';

import formatJsonReadable from '../utils/formatJsonReadable';

const prod = true

const HOST = prod ? 'https://comex-utils.onrender.com' : 'http://127.0.0.1:5000'

function PostLinks() {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [stage, setStage] = useState(0);
    const [responseTitle, setResponseTitle] = useState('Nenhuma resposta por enquanto.');
    const [responseColor, setResponseColor] = useState('neutral');
    const [results, setResults] = useState({
        response: [], 
        status: null, 
        text: ''
    });

    useEffect(() => {
        if (results.status) {
            if (results.status === 200) {
                setResponseColor('ok')
            } else {
                setResponseColor('error')
            }
        } else {
            setResponseColor('neutral');
        }
    }, [results]);

    async function handleUpload() {
        try {
            setLoading(true);

            const data = fileList[0].blobFile;
            const formData = new FormData();
            formData.append('file', data);

            const url = HOST + '/links-payload';

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const status = response.status;
            const content = await response.json();

            const formattedText = formatJsonReadable(content);

            setResults({
                response: content,
                status: status,
                text: formattedText
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
            const url = HOST + '/post-links';

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

            const content = await response.json();
            const formattedText = formatJsonReadable(content);

            setResults({
                content: content,
                status: response.status,
                text: formattedText
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
        <div id='gerar-planilha'>
            <div className="central-container">

            <div className='input-container'>
                <h1>Realizar Link</h1>
                <h2>Linkar produtos e operadores estrangeiros no Portal Único.</h2>
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
                    disabled={fileList.length === 0 || (stage === 1 && results.errors.length > 0)}
                    >
                    {stage === 0 ? 'Upload' : 'Confirmar'}
                </Button>
            </div>

            <br />
            <div className={`response-container ${responseColor}`}>
                <p>{ responseTitle }</p>
                <pre className='response'>
                    {results.text || ''}
                </pre>
            </div>
                    </div>
                    {/* <div className='help'>
                    <h3>Modo de usar:</h3>
                    <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

</p>
                    </div> */}
        </div>
    );
}

export default PostLinks;
