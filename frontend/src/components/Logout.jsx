import useAuth from "../hooks/AuthContext";

const Logout = () => {
    const { logout } = useAuth();

    return (
        <button onClick={logout} className="logout-button">
            Logout
        </button>
    );
};

export default Logout;
