import React from 'react';
import { useState, useRef, useEffect, useContext } from 'react'

import { Uploader, Input, Button } from 'rsuite'

function Header() {
  
    const [certificateShow, setCertificateShow] = useState(false)
    const [certificateDetails, setCertificateDetails] = useState(null)
    const [testConectionLoading, setTestConectionLoading] = useState(false)
    const [certificatePassword, setCertificatePassword] = useState(null)
    const [conectionValidated, setConectionValidated] = useState(true)
    const [certificateAuthenticationErrorMessage, setCertificateAuthenticationErrorMessage] = useState('')
    const certificateInputRef = useRef(null);
    const [fileList, setFileList] = useState([]);
  
    useEffect(() => {
      setConectionValidated(false)
    }, [certificateDetails, certificatePassword])
  
    const handleCertificateChange = (fileList, event) => {
      const file = fileList[0]?.blobFile;
      if (file) {
        setCertificateDetails(file);
      }
    };
  
    const handleUpload = async () => {
        try {
          setCertificateAuthenticationErrorMessage('')
          setTestConectionLoading(true)
  
          const data = certificateDetails;
          const formData = new FormData();
          formData.append('file', data);
          
          const response = await fetch('http://127.0.0.1:5000/authenticate-certificate', {
              method: 'POST', 
              headers: { password: certificatePassword }, 
              body: formData
          });
  
          const response_data = await response.json()

          const sessionId = response_data['session-id']

          console.log(response_data)

          if (sessionId) {
            // Define cookie para session-id, com path e tempo de expiração opcional
            document.cookie = `session-id=${sessionId}; path=/; Secure; SameSite=Strict`;
          }
  
          console.log(response_data)
  
          if (response_data.status == 'ok') {
            setConectionValidated(true)
          } else {
            setCertificateAuthenticationErrorMessage(String(response_data.message).includes('password') ? 'Senha incorreta.' : '')
          }
  
      } catch (error) {
          console.error('Erro ao fazer upload do arquivo:', error);
      } finally {
        setTestConectionLoading(false);
      }
    }
    return (
      <header>
      <div className='certificate-container'>
        <Button onClick={() => setCertificateShow(prev => !prev) } appearance='ghost' color={certificateDetails && certificatePassword ? 'green' : 'red'}>{ certificateDetails ? certificateDetails.name : 'Selecionar certificado' }</Button>
        <div className={`certificate-box ${certificateShow ? 'active' : ''}`}>
          <Uploader 
            autoUpload={false} 
            ref={certificateInputRef} 
            onChange={handleCertificateChange} 
            onRemove={() => { setCertificateDetails(null); setCertificateAuthenticationErrorMessage('') }} 
            listType="picture-text" 
            action='http://127.0.0.1:5000/authenticate-certificate' 
          />
          <br />
          <Input placeholder='Senha do certificado' type='password' onChange={setCertificatePassword} disabled={!certificateDetails}/>
          <p style={{ color: 'red', fontWeight: '300' }}>{ certificateAuthenticationErrorMessage }</p>
          <br />
          <Button 
            color={conectionValidated ? 'green' : 'blue'} 
            appearance="primary" 
            onClick={() => handleUpload() } 
            loading={testConectionLoading} 
            disabled={conectionValidated} 
            block
          >
            { conectionValidated ? 'Autenticado!' : 'Autenticar'}
          </Button>
        </div>
      </div>
    </header>
    )
  }

  export default Header