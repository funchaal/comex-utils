import React, { useRef, useState, useContext } from 'react';

import { AuthProvider, AuthContext } from '../AuthContext';

import { Button, Uploader } from 'rsuite';

function GerarPlanilha() {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    const { setToken, setSetToken, csrfToken, setCsrfToken } = useContext(AuthContext)

    async function handleUpload() {
        try {
            setLoading(true)

            const data = fileList[0].blobFile;
            const formData = new FormData();
            formData.append('file', data);
            
            const response = await fetch('http://localhost:5000/make-sheet', {
                method: 'POST', 
                headers: {
                    'set-token': setToken, 
                    'csrf-token': csrfToken
                }, 
                body: formData
            });

            const file = await response.blob();

            handleDownload(file);

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

    return(
        <div>
            <h1>Gerar planilha</h1>
            <h2>Gerar planilha para preenchimento dos atributos.</h2>
            <br />
            <div>
            <Uploader 
                action="http://127.0.0.1:5000/make-sheet" 
                draggable 
                autoUpload={false} 
                multiple={false}
                onChange={(fileList) => { setFileList(fileList) }}
            >
                <div className="drop-file" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span>Click or Drag files to this area to upload</span>
                </div>
            </Uploader>
            <br />
            <Button 
                size='lg'
                color='pink'
                appearance="primary"
                style={{ float: 'right' }}
                onClick={() => { handleUpload() }} className='upload-button' loading={loading}
                disabled={fileList.length === 0}
                >Gerar planilha
            </Button>
            </div>
            <div className='orientation'>
                <h3>Orientação</h3>
                <p>Essa funcionalidade gera uma planilha para preenchimento dos atributos, onde cada linha representa um produto.</p>
                <p>Você deve carregar uma planilha contendo as colunas com informações básicas do produto mostradas abaixo, onde a única obrigatória a estar preenchida é a coluna <strong>'NCM'</strong>.</p>
                <p>Modelo da planilha que deve ser carregada: <br /></p>
                <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th>Raíz</th>
                            <th>NCM</th>
                            <th>Descrição</th>
                            <th>Denominação</th>
                            <th>Código Interno</th>
                            <th>Modalidade</th>
                            <th>Situação</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>12345678</td>
                            <td>2203.00.00</td>
                            <td>XXXXXXX</td>
                            <td>YYYYYYY</td>
                            <td>0000001</td>
                            <td>IMPORTACAO</td>
                            <td>ATIVADO</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    )
}

export default GerarPlanilha;