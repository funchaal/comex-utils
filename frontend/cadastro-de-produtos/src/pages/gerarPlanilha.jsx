import React, { useState, useEffect } from 'react';

import { Button, Uploader } from 'rsuite';

// utils/config.js
export const HOST = import.meta.env.MODE === 'production'
  ? 'https://comex-utils.onrender.com'
  : 'http://127.0.0.1:5000';


import JsonCardViwer from '../components/JsonCardViwer';

function GerarPlanilha() {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

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
            setLoading(true)

            const data = fileList[0].blobFile;
            const formData = new FormData();
            formData.append('file', data);

            const url = HOST + '/make-sheet'
            
            const response = await fetch(url, {
                method: 'POST', 
                body: formData
            });

            const file = await response.blob();

            handleDownload(file);

            const status = response.status

            if (status === 200) {
                setResponseTitle('Planilha gerada com sucesso!');
            } else {
                setResponseTitle('Erro ao gerar a planilha.');
            }
            setResults({
                content: [],
                status: status
            });

        } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
        } finally {
            setLoading(false);
        }

    }

    async function handleDownload(response) {
        // Converte a resposta em Blob (binário)
        try {
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Cria uma URL temporária para o Blob
            const url = window.URL.createObjectURL(blob);

            // Cria um link temporário para acionar o download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'fill_sheet.xlsx'); // Nome do arquivo para o download
            document.body.appendChild(link);
            link.click(); // Simula o clique para iniciar o download

            // Remove o link temporário após o download
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url); // Limpa a URL criada
        } catch (error) {
            console.error('Erro ao baixar o arquivo:', error);
        }
    }

        return (
        <div id='post-operators' className='main-container'>
            <div className='input-container'>
                <h1>Gerar planilha</h1>
                <h2>Gerar planilha para preenchimento dos atributos.</h2>
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
                    onClick={() => { handleUpload() }}
                    className='upload-button'
                    loading={loading}
                    >
                    Gerar
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

export default GerarPlanilha;