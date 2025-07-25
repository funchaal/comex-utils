import React, { useState, useRef, useContext } from 'react'
import { Uploader, Button } from 'rsuite'

import { AuthContext } from '../AuthContext'

import Input from './Input'

import Modal from './Modal'

// utils/config.js
export const HOST = import.meta.env.MODE === 'production'
  ? 'https://comex-utils.onrender.com'
  : 'http://127.0.0.1:5000';


function CertificateContainer({ show, onClose }) {
    const { setCertificate, setCertificatePassword, certificatePassword } = useContext(AuthContext)

  const [certificateDetails, setCertificateDetails] = useState(null)
  const [fileList, setFileList] = useState([]);
  const [certificateAuthenticationErrorMessage, setCertificateAuthenticationErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conectionValidated, setConectionValidated] = useState(false)
  const certificateInputRef = useRef(null)

  const handleUpload = async () => {
    try {
        setLoading(true)
        setCertificateAuthenticationErrorMessage('')

        const data = fileList[0].blobFile;
        const formData = new FormData();
        formData.append('file', data);
        
        const response = await fetch(HOST + '/authenticate-certificate', {
            method: 'POST',
            headers: { password: certificatePassword },
            body: formData
        })
        
        const response_data = await response.json()
        
        const sessionId = response_data['session-id']
        
        if (sessionId) {
            document.cookie = `session-id=${sessionId}; path=/; Secure; SameSite=Strict`
        }
        
        if (response.status === 200) {
            setConectionValidated(true)

            setCertificate(data)

        } else {
            setCertificateAuthenticationErrorMessage(
            String(response_data.message).includes('password') ? 'Senha incorreta.' : response_data.message
            )
        }
    } catch (error) {
        console.error('Erro ao fazer upload do arquivo:', error)
    } finally {
        setLoading(false)
    }
  }

  if (!show) return null

  return (
    <Modal show={show} onClose={onClose} title="Adicionar Certificado .pfx" x_mobile={false}>
      <br />
      <Uploader
          draggable
          autoUpload={false}
          ref={certificateInputRef}
          onChange={(fileList) => setFileList(fileList)}
          onRemove={() => {
            setCertificateDetails(null)
            setCertificateAuthenticationErrorMessage('')
          }}
          multiple={false}
          fileList={fileList}
          action=""
        >
          <div className="drop-file">
            <p>Click or Drag files to this area to upload</p>
          </div>
        </Uploader>
        <div>

            <br />
            <div>
        <Input
          label="Senha do certificado"
          type="password"
          value={certificatePassword}
          onChange={setCertificatePassword}
          disabled={!certificateDetails}
          />
        {certificateAuthenticationErrorMessage && (
            <p className="error">{certificateAuthenticationErrorMessage}</p>
        )}
        </div>
        {/* </div> */}

        <Button
          color={conectionValidated ? 'green' : 'blue'}
          appearance="primary"
          onClick={handleUpload}
          loading={loading}
          disabled={conectionValidated}
          style={{ borderRadius: '15px', height: '2.5rem' }}
          block
          >
          {conectionValidated ? 'Autenticado!' : 'Autenticar'}
        </Button>
            </div>
    </Modal>
  )
}

export default CertificateContainer
