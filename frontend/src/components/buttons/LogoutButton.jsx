import React from "react";
import { Button } from "react-bootstrap";
import useAuth from "../../hooks/AuthContext";

const LogoutButton = ({ buttonVariant = "danger" }) => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return <div className="logout-button-container">
        <Button variant={buttonVariant} onClick={handleLogout}>
            Logout
        </Button>
    </div>
};

export default LogoutButton;