import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Form, InputGroup } from 'react-bootstrap';
import { Send, Robot } from 'react-bootstrap-icons';
import '../styles/components/ChatBot.css';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [currentFlow, setCurrentFlow] = useState(null);
    const messagesEndRef = useRef(null);

    // Initial bot message with options
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            addBotMessage("Hello! How can I help you today?", [
                { text: "Form Submission Help", flow: "form" },
                { text: "Account Questions", flow: "account" },
                { text: "Technical Issues", flow: "technical" }
            ]);
        }
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addBotMessage = (text, options = []) => {
        setMessages(prev => [...prev, {
            text,
            sender: 'bot',
            options,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, {
            text,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const handleOptionSelect = (option) => {
        addUserMessage(option.text);

        // Process the selected flow
        switch (option.flow) {
            case 'form':
                setCurrentFlow('form');
                addBotMessage("What would you like to know about form submissions?", [
                    { text: "How to submit a form", flow: "form_submit" },
                    { text: "Check form status", flow: "form_status" },
                    { text: "Edit a submitted form", flow: "form_edit" }
                ]);
                break;

            case 'account':
                setCurrentFlow('account');
                addBotMessage("What account-related question do you have?", [
                    { text: "Update profile", flow: "account_update" },
                    { text: "Change password", flow: "account_password" },
                    { text: "Delete account", flow: "account_delete" }
                ]);
                break;

            case 'technical':
                setCurrentFlow('technical');
                addBotMessage("What technical issue are you experiencing?", [
                    { text: "Page not loading", flow: "tech_page" },
                    { text: "Form errors", flow: "tech_form" },
                    { text: "Performance issues", flow: "tech_performance" }
                ]);
                break;

            // Add more specific flows here
            case 'form_submit':
                addBotMessage("To submit a form: 1. Go to Forms section 2. Click 'New Form' 3. Fill all required fields 4. Click Submit");
                break;

            case 'form_status':
                addBotMessage("You can check form status in 'My Submissions' section. Each form shows its current status with color indicators.");
                break;
            
            case 'form_edit':
                addBotMessage("To edit a submitted form: 1. Go to 'My Submissions' 2. Find the form you want to edit 3. Click 'Edit' (if available) 4. Make your changes 5. Resubmit. Note: Not all forms can be edited after submission.");
                break;
    
            // Account-related flows
            case 'account_update':
                addBotMessage("To update your profile: 1. Click on your name in the navigation bar 2. Select 'Edit Profile' in the screen that opens 3. Edit your information 4. Click 'Save Changes' to confirm your updates");
                break;
    
            case 'account_password':
                addBotMessage("To update your password: 1. Click on your name in the navigation bar 2. Select 'Edit Profile' 3. Enter your new password in the password field 4. Click 'Save Changes' to confirm");
                break;
    
            case 'account_delete':
                addBotMessage("Account deletion requires administrator approval. Please contact administrator to request account deletion. They will guide you through the process.");
                break;
    
            // Technical issue flows
            case 'tech_page':
                addBotMessage("For page loading issues: 1. Refresh the page 2. Clear your browser cache 3. Try a different browser 4. Check your internet connection. If problem persists, contact support with details about the page URL and error message.");
                break;
    
            case 'tech_form':
                addBotMessage("For form errors: 1. Check all required fields are filled 2. Ensure data is in correct format 3. Try submitting again 4. Take a screenshot of any error messages. Common issues include: invalid email formats, missing fields, or session timeouts.");
                break;

            // Add responses for other options
            default:
                addBotMessage("I'm not sure how to help with that. Please try asking differently.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        addUserMessage(userInput);
        setUserInput('');

        // Simple response for free-form input
        setTimeout(() => {
            addBotMessage("I'm a guided bot. Please select from the options provided for better assistance.");
        }, 1000);
    };

    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            <div className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
                <Robot size={24} />
            </div>

            {isOpen && (
                <Card className="chatbot-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <span>Help Assistant</span>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                                setMessages([]);
                                setCurrentFlow(null);
                            }}
                        >
                            Reset
                        </Button>
                    </Card.Header>

                    <Card.Body className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-content">
                                    {msg.text}
                                    <div className="message-time">{msg.timestamp}</div>
                                </div>
                                {msg.options && (
                                    <div className="options-container">
                                        {msg.options.map((opt, i) => (
                                            <Button
                                                key={i}
                                                variant="outline-primary"
                                                size="sm"
                                                className="option-button"
                                                onClick={() => handleOptionSelect(opt)}
                                            >
                                                {opt.text}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </Card.Body>

                    <Card.Footer>
                        <Form onSubmit={handleSubmit}>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Type your question..."
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                />
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={!userInput.trim()}
                                >
                                    <Send size={18} />
                                </Button>
                            </InputGroup>
                        </Form>
                    </Card.Footer>
                </Card>
            )}
        </div>
    );
};

    export default ChatBot;