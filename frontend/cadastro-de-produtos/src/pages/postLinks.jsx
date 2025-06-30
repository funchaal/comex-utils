import React, { useState, useEffect } from 'react';
import { Button, Uploader } from 'rsuite';
import Modal from '../components/Modal';

// utils/config.js
export const HOST = import.meta.env.MODE === 'production'
  ? 'https://comex-utils.onrender.com'
  : 'http://127.0.0.1:5000';

function PostLinks() {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [stage, setStage] = useState(0);
  const [responseTitle, setResponseTitle] = useState('Nenhuma resposta por enquanto.');
  const [responseClass, setResponseClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [results, setResults] = useState({
    content: [],
    status: null
  });

  useEffect(() => {
    if (results.status) {
      setResponseClass(results.status === 200 ? 'ok' : 'error');
    } else {
      setResponseClass('');
    }

    if (results.status !== 200 && stage === 0) setModalType('errors');
    if (results.status === 200 && stage === 1) setModalType('review');
    if (results.status === 200 && stage === 0) setModalType('final');
  }, [results]);

  function getModalButtonLabel() {
    if (!results.content || results.content.length === 0) return null;

    if (results.status !== 200 && stage === 0)
      return '⚠️ Alguns erros precisam ser ajustados (Visualizar)';

    if (results.status === 200 && stage === 1)
      return '🔎 Ver Payload Gerado';

    if (results.status === 200 && stage === 0)
      return '📦 Ver Resposta do Servidor';

    return null;
  }

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

      setResults({ content, status });

      if (status === 200) {
        setResponseTitle('Verifique o payload gerado abaixo e confirme para enviar os links.');
        setStage(1);
      } else {
        setResponseTitle('Alguns erros ocorreram ao gerar o payload. Verifique os erros abaixo.');
      }

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

      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session-id='))
        ?.split('=')[1];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-id': sessionId || ''
        },
        body: JSON.stringify(payload)
      });

      const status = response.status;
      const content = await response.json();

      setResults({ content, status });
      setResponseTitle('Verifique a resposta do servidor abaixo.');
      setStage(0);

    } catch (error) {
      console.error('Erro ao confirmar:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id='post-links' className='main-container'>
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
              <p>Click ou arraste arquivos para esta área</p>
            </div>
          </Uploader>
        </div>

        <br />

        <Button
          size='lg'
          color='pink'
          appearance="primary"
          style={{ float: 'right' }}
          onClick={() => { stage === 0 ? handleUpload() : handleConfirm(); }}
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
        <p>{responseTitle}</p>

        {getModalButtonLabel() && (
          <button
            className="open-modal-button"
            onClick={() => {
              if (results.status !== 200 && stage === 0) setModalType('errors');
              else if (results.status === 200 && stage === 1) setModalType('review');
              else if (results.status === 200 && stage === 0) setModalType('final');
              setShowModal(true);
            }}
          >
            {getModalButtonLabel()}
          </button>
        )}
      </div>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'errors' ? 'Erros no Payload' :
          modalType === 'review' ? 'Payload para Revisão' :
          modalType === 'final' ? 'Resposta do Servidor' : ''
        }
      >
        {modalType === 'review' && (
          <div className='json-preview'>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(results.content, null, 2)}
            </pre>
          </div>
        )}

        {(modalType === 'errors' || modalType === 'final') && Array.isArray(results.content) && (
          <div className='table-container'>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {Object.keys(results.content[0] || {}).map(key => (
                    <th key={key} style={{ border: '1px solid #ccc', padding: '6px' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.content.map((item, idx) => (
                  <tr key={idx}>
                    {Object.values(item).map((val, i) => (
                      <td key={i} style={{ border: '1px solid #ccc', padding: '6px' }}>{val?.toString()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PostLinks;
