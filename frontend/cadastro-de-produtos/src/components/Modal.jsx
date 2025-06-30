import React from 'react'

function Modal({ show, onClose, title, x_mobile = true, children }) {
    if (!show) return null

    return (
        <div className="certificate-overlay" onClick={onClose}>
    <div className="certificate-container">
      <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
        <p className='certificate-modal-title'>{ title }</p>
        <div className={`modal-close-desktop ${x_mobile ? 'shown' : 'hidden'}`}>
          <button onClick={onClose} className='x'>
          ✕
        </button>
        </div>
        </div>
        { children }
            </div>
      </div>
    </div>
    )
}

export default Modal