// === Imports ===
import React, { useState, useEffect } from 'react';
import { Button, Uploader } from 'rsuite';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/1337.css';

import Modal from '../components/Modal';
import Results from '../components/Results';
import { AuthContext } from '../AuthContext';

// === Constantes ===
export const HOST =
  import.meta.env.MODE === 'production'
    ? 'https://comex-utils.onrender.com'
    : 'http://127.0.0.1:5000';

// === Componente Principal ===
function PostProducts() {
  // === Estados ===
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'errors' | 'review' | 'final'
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [stage, setStage] = useState(0);
  const [responseTitle, setResponseTitle] = useState('Nenhuma resposta por enquanto.');
  const [responseClass, setResponseClass] = useState('');
  const [results, setResults] = useState({ content: [], status: null });

  // === Efeitos ===
  useEffect(() => {
    if (results.status) {
      setResponseClass(results.status === 200 ? 'ok' : 'error');
    } else {
      setResponseClass('');
    }

    if (results.status !== 200 && stage === 0) {
      setModalType('errors');
    } else if (results.status === 200 && stage === 1) {
      setModalType('review');
    } else if (results.status === 200 && stage === 0) {
      setModalType('final');
    }
  }, [results]);

  // === Handlers ===
  async function handleUpload() {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', fileList[0].blobFile);

      const response = await fetch(`${HOST}/products-payload`, {
        method: 'POST',
        body: formData,
      });

      const status = response.status;
      const content = await response.json();

      setResults({ content, status });

      if (status === 200) {
        setResponseTitle('Verifique o payload gerado abaixo e confirme para enviar os produtos.');
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
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session-id='))
        ?.split('=')[1];

      const response = await fetch(`${HOST}/post-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'session-id': sessionId || '',
        },
        body: JSON.stringify(payload),
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

  function getModalButtonLabel() {
    if (!results.content || results.content.length === 0) return null;

    if (results.status !== 200 && stage === 0) return '⚠️ Alguns erros precisam ser ajustados (Visualizar)';
    if (results.status === 200 && stage === 1) return '🔎 Ver Payload Gerado';
    if (results.status === 200 && stage === 0) return '📦 Ver Resposta do Servidor';

    return null;
  }

  // === Renderização ===
  return (
    <div id="post-operators" className="main-container">
      {/* === Cabeçalho === */}
      <div className="input-container">
        <h1>Cadastrar Produtos</h1>
        <h2>Cadastrar produtos no Portal Único.</h2>

        {/* === Área de Upload === */}
        <div className="drop-file-container">
          <Uploader
            action=""
            draggable
            autoUpload={false}
            multiple={false}
            onChange={setFileList}
          >
            <div className="drop-file">
              <p>Click ou arraste arquivos para essa área</p>
            </div>
          </Uploader>
        </div>

        <br />

        {/* === Botão de Ação === */}
        <Button
          size="lg"
          color="pink"
          appearance="primary"
          style={{ float: 'right' }}
          className="upload-button"
          onClick={() => (stage === 0 ? handleUpload() : handleConfirm())}
          loading={loading}
          disabled={fileList.length === 0 || (stage === 1 && results.status !== 200)}
        >
          {stage === 0 ? 'Upload' : 'Confirmar'}
        </Button>
      </div>

      <br />

      {/* === Resposta === */}
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

      {/* === Modal === */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'errors'
            ? 'Erros no Payload'
            : modalType === 'review'
            ? 'Payload para Revisão'
            : modalType === 'final'
            ? 'Resposta do Servidor'
            : ''
        }
      >
        {modalType === 'review' && (
          <div className="json-preview">
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(results.content, null, 2)}
            </pre>
          </div>
        )}

        {(modalType === 'errors' || modalType === 'final') &&
          Array.isArray(results.content) && (
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {Object.keys(results.content[0] || {}).map(key => (
                      <th key={key} style={{ border: '1px solid #ccc', padding: '6px' }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.content.map((item, idx) => (
                    <tr key={idx}>
                      {Object.values(item).map((val, i) => (
                        <td key={i} style={{ border: '1px solid #ccc', padding: '6px' }}>
                          {val?.toString()}
                        </td>
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

export default PostProducts;
