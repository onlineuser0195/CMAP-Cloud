import React from "react";
import { Modal, Button } from 'react-bootstrap';
import '../../styles/components/alertModal.css';

const AlertModal = ({ content, show, handleClose }) => {

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered // To center the modal vertically
            dialogClassName={'modal-dialog-centered'}
        >
            <Modal.Header>
                <div className='modal-title'>
                    <Modal.Title>Action Status</Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body className="text-center">
                {content}
            </Modal.Body>
            <Modal.Footer>
                <div className="modal-button">
                    <Button variant="primary" onClick={handleClose}>
                        Okay
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default AlertModal;
