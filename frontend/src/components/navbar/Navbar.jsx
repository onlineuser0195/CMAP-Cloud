import { Link, NavLink } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import '../../styles/components/Navbar.css';
import useAuth from "../../hooks/AuthContext";
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { USER_ROLES } from "../../constants/constants";
import { systemAPI } from "../../api/api";


export const NavBar = () => {
    const { logout, userRole, mappedRole, userId, firstName, lastName, isAuthenticated, isLoading, system } = useAuth();
    const [systemName, setSystemName] = useState('');
    const [systemFullName, setSystemFullName] = useState('');
    
    useEffect(() => {
        if (!system) {
            setSystemName(''); // Clear when system is cleared
            setSystemFullName('');
            return;
        }
        systemAPI.getSystemDetails(system)
            .then(res => {setSystemName(res.data.name); setSystemFullName(res.data.full_name);})
            .catch(() => {setSystemName(''); setSystemFullName(res.data.full_name);});
    }, [system]);

    // const [user, setUser] = useState('');

    // // useEffect(() => {
    // //     if (!isLoading && firstName && lastName) {
    // //         setUser(`${firstName} ${lastName}`);
    // //     }
    // // }, [firstName, lastName, isLoading]);

    if (isLoading) return null;

    const fullName = firstName && lastName ? `${firstName} ${lastName}` : '';

    // if (!isAuthenticated) return null; // hide NavBar if not logged in
 
    // const navigate = useNavigate();
    // const handleLogout = (e) => {
    //     e.preventDefault();
    //     logout();
    // };

    // const [role, setUserRole] = useState(null);
    // useEffect(() => {
    //     const userRole = localStorage.getItem(USER_ROLE_KEY);
    //     setUserRole(userRole);
    //     console.log(userRole)
    //     // If the role is not found or invalid, redirect to the login page
    //     if (!userRole) {
    //         navigate('/login');
    //     }
    // }, []);

    return (
        <nav className="navbar">
            <div className="navbar__left">
            {/* <NavLink className="navbar-brand" to="https://www.syneren.com/products.html" style={{ display: "inline-block" }}>
                <img
                    alt="Syneren logo"
                    style={{ width: "100px", height: "auto"}}
                    src="/syneren.svg"
                ></img>
            </NavLink> */}
            {systemName &&
            <li className="navbar-brand">
                <div className="navbar__icon">
                    {/* Icon if needed */}
                </div>
                <span className={`role-badge SYSTEM`}>
                    {systemName}
                    {/* {userRole === USER_ROLES.GLOBAL_ADMIN && 'Configuration Specialist'}
                    {userRole === USER_ROLES.APP_USER && 'Embassy User'}
                    {userRole === USER_ROLES.CONFIRMATION_USER && 'Confirmation User'}
                    {userRole === USER_ROLES.SUPERVISOR && 'Approver'}
                    {userRole === USER_ROLES.LOCAL_ADMIN && 'Admin'} */}
                </span>
            </li>}
            <li className="navbar__item">
                <div className="navbar__icon">
                    {/* Icon if needed */}
                </div>
                <span className={`role-badge ${mappedRole}`}>
                    {userRole}
                    {/* {userRole === USER_ROLES.GLOBAL_ADMIN && 'Configuration Specialist'}
                    {userRole === USER_ROLES.APP_USER && 'Embassy User'}
                    {userRole === USER_ROLES.CONFIRMATION_USER && 'Confirmation User'}
                    {userRole === USER_ROLES.SUPERVISOR && 'Approver'}
                    {userRole === USER_ROLES.LOCAL_ADMIN && 'Admin'} */}
                </span>
            </li>
            </div>
            <ul className="navbar__list navbar__right">
            { isAuthenticated ? (
                <>
                            <div className="navbar__center">
                { (!systemFullName) ? (
                <a href="/" className="mx-auto text-center navbar-brand text-white ml-10 cmap">
                        CMAP&nbsp;<sup><small>SM</small></sup>&nbsp;Case Management Application Platform
                </a>
                ):( 
                <a href="/" className="mx-auto text-center navbar-brand text-white ml-10 cmap">
                        CMAP&nbsp;<sup><small>SM</small></sup>&nbsp; - {systemFullName}
                </a>)}
            </div>
                    <li className="navbar__item">
                        <Link className="navbar__link profile" to={`/profile/${userId}`}>
                            <div className="navbar__icon">
                                <PersonIcon fontSize="small" style={{ marginRight: '6px' }} />
                            </div>
                            {fullName}
                        </Link>
                    </li>
                    <li className="navbar__item">
                        <Link className="navbar__link home" to="/home">
                            <div className="navbar__icon">
                                <HomeIcon fontSize="small" style={{ marginRight: '6px' }} />
                            </div>
                            Home
                        </Link>
                    </li>
                    {mappedRole === USER_ROLES.VIEWER && 
                        <li className="navbar__item">
                            <Link className="navbar__link alerts" to="/alerts">
                                <div className="navbar__icon">
                                    <NotificationsIcon fontSize="small" style={{ marginRight: '6px' }} />
                                </div>
                                Alerts
                            </Link>
                        </li>
                    }
                    {(mappedRole === USER_ROLES.GLOBAL_ADMIN || mappedRole === USER_ROLES.LOCAL_ADMIN ) &&  <li className="navbar__item">
                        <Link className="navbar__link users" to="/user-management">
                            <div className="navbar__icon">
                                <GroupIcon fontSize="small" style={{ marginRight: '6px' }} />
                            </div>
                            Manage Users
                        </Link>
                    </li>}
                    {[USER_ROLES.APP_USER, USER_ROLES.CONFIRMATION_USER, USER_ROLES.SUPERVISOR, USER_ROLES.VIEWER].includes(mappedRole) && <li className="navbar__item">
                         <Link className="navbar__link faq" to="/help">
                             <div className="navbar__icon">
                                 <HelpIcon fontSize="small" style={{ marginRight: '6px' }} />
                             </div>
                             Help
                         </Link>
                     </li>}
                    <li className="navbar__item">
                        <a href="#" className="navbar__link logout" onClick={logout}>
                        <div className="navbar__icon">
                            <LogoutIcon fontSize="small" style={{ marginRight: '6px' }} />
                        </div>
                        Logout
                        </a>
                    </li>
                </>): (
                    <>
                        <li style={{ visibility: 'hidden' }}>placeholder</li>
                        <li style={{ visibility: 'hidden' }}>placeholder</li>
                        <li style={{ visibility: 'hidden' }}>placeholder</li>
                    </>
                )}
            </ul>
        </nav>
    );
};