import React, { useState } from 'react';
import { Container, Form, Row, Col } from 'react-bootstrap';
import '../styles/layouts/Help.css'; // For any custom styles not covered by Bootstrap
import { Link, useParams } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import ChatBot from '../components/ChatBot';

const Help = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const faqData = [
        {
            id: 1,
            question: "How do I submit a new request?",
            answer: "From the home page, select the relevant system, go to its request form, fill in the required details, and click 'Submit' to complete your request."
        },
        {
            id: 2,
            question: "How can I check the status of my submitted request?",
            answer: "Select the system where you submitted the request, locate the corresponding form, and the status will be displayed with color-coded indicators for easy reference."
        },
        {
            id: 3,
            question: "What should I do if my request is rejected?",
            answer: "If your request is rejected, check the status in the system where you submitted it. The rejection reason will be shown there. You can then edit the form and resubmit it with the necessary corrections."
        },
        {
            id: 4,
            question: "How long does approval typically take?",
            answer: "Approval times vary depending on the form type. Standard requests are usually processed within 3-5 business days. Complex requests may take up to 2 weeks."
        },
        {
            id: 5,
            question: "Can I edit a request after submission?",
            answer: "Requests can only be edited if they're in 'Draft' or 'Rejected' status. Once submitted for approval, you'll need to contact support to make changes."
        },
        {
            id: 6,
            question: "Where can I find my submission history?",
            answer: "To view your submission history, go to the home page, select the relevant system, then choose the form you're interested in - this will display all your previously submitted forms for that specific request type."
        }
    ];

    const filteredFaqs = faqData.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleQuestion = (id) => {
        setExpandedQuestion(expandedQuestion === id ? null : id);
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center mb-4">
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                    variant="contained"
                    color="warning"
                    component={Link}
                    to="/support-ticket"
                    sx={{fontWeight: 'bold',
                        color: 'white',
                        '&:hover': {
                        color: 'black',
                        },
                     }}
                    >
                    Raise a Ticket
                    </Button> 
                </Box>         
                <Col md={10} lg={8}>
                    <header className="text-center mb-4">
                        <h1 className="mb-3">Frequently Asked Questions</h1>
                        <div className="position-relative">
                            <Form.Control
                                type="search"
                                placeholder="Search FAQs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-5"
                            />
                            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                                <i className="bi bi-search"></i>
                            </span>
                        </div>
                    </header>

                    {filteredFaqs.length > 0 ? (
                        <div className="border-top">
                            {filteredFaqs.map(faq => (
                                <div key={faq.id} className="border-bottom">
                                    <div
                                        className="d-flex justify-content-between align-items-center py-3 cursor-pointer"
                                        onClick={() => toggleQuestion(faq.id)}
                                    >
                                        <h3 className="mb-0 fs-5 fw-medium">{faq.question}</h3>
                                        <span className={`fs-4 text-muted ${expandedQuestion === faq.id ? 'expanded' : ''}`}>
                                            {expandedQuestion === faq.id ? '−' : '+'}
                                        </span>
                                    </div>
                                    {expandedQuestion === faq.id && (
                                        <div className="pb-3 animate-fade-in">
                                            <p className="mb-0 text-secondary">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted">
                            <p className="mb-0">No FAQs found matching your search.</p>
                        </div>
                    )}
                </Col>
            </Row>
            <ChatBot/>
        </Container>
    );
};

export default Help;