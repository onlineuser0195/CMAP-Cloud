import React, { useEffect, useState } from "react";
import '../styles/pages/Login.css';
import { loginAPI, systemAPI } from "../api/api";
import { USER_ROLES } from "../constants/constants";
import { Typography, Button, Paper, Box } from "@mui/material";
import useAuth from "../hooks/AuthContext";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/buttons/BackButton";
import { formatUserRole } from "../utils/util";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../hooks/AuthContext";
import axios from "axios";
import { JWT_TOKEN_KEY } from "../constants/constants";
import {
    Person as EmbassyUserIcon,
    SupervisorAccount as ApproverIcon,
    PersonPin as ConfirmationUserIcon,
    AdminPanelSettings as AdminIcon,
    ManageAccounts as ConfigSpecialistIcon,
    Computer as SystemIcon
  } from '@mui/icons-material';
import { logEvent } from "../services/logger";

const Login = () => {
    const [systems, setSystems] = useState([]);
    const [selectedSystem, setSelectedSystem] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [mappedRole, setMappedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { login, isLoggedIn } = useAuth();
    const { instance, inProgress } = useMsal();
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
    
    const navigate = useNavigate();
    const tileColors = ['#baedf1', '#c4ebc5', '#f4e1c4', '#f9cfcd', '#eac7f0']; 
    // Add as many colors as you want

    const roleIconMap = {
        APP_USER: {
            Icon: EmbassyUserIcon,
            className: "embassy_user",
        },
        SUPERVISOR: {
            Icon: ApproverIcon,
            className: "approver",
        },
        CONFIRMATION_USER: {
            Icon: ConfirmationUserIcon,
            className: "confirmation_user",
        },
        LOCAL_ADMIN: {
            Icon: ConfigSpecialistIcon,
            className: "config_specialist",
        },
        ADMIN: {
            Icon: ConfigSpecialistIcon,
            className: "config_specialist",
        },
        VIEWER: {
            Icon: AdminIcon,
            className: "admin",
        },
        IT_USER: {
            Icon: AdminIcon,
            className: "admin",
        },
        SPAN_SUPPORT_USER: {
            Icon: ApproverIcon,
            className: "approver",
        },
        INDUSTRY_APPLICANT: {
            Icon: EmbassyUserIcon,
            className: "embassy_user",
        },
        PROJECT_MANAGER: {
            Icon: EmbassyUserIcon,
            className: "embassy_user",
        },
        GOVERNMENT_LEAD: {
            Icon: ApproverIcon,
            className: "approver",
        },
        PORTFOLIO_OWNER: {
            Icon: AdminIcon,
            className: "admin",
        }
    };


// For Microsoft Login Validatin and Login Handler
const handleValidateAndLogin = async () => {
    try {
      // 1. Validate user in your DB
      const userData = await loginAPI.validateUser(email, selectedRole, selectedSystem.system_id);

      logEvent(email, 'Tried Logging', {  selectedRole, selectedSystem: selectedSystem.system_id });

    //   console.log('User Data in DB', userData); 
    }  catch (validationError) {
        console.error("Validation failed:", validationError);
        setErrorMessage(
        validationError.response?.data?.error ||
        "User is not registered. Please contact Admin."
        );
        return; // stop here — don’t do any of the MSAL or token calls
    }

    try {

      if (inProgress !== "none") {
        // console.log("Login already in progress, skipping.");
        return;
      }

      // 2. Microsoft login with proper token acquisition
    let msalResponse;
    try {
        msalResponse = await instance.loginPopup({
        ...loginRequest,
        loginHint: email
        });
    } catch (err) {
        setErrorMessage("Microsoft sign-in was cancelled or failed.");
        return;
    }

        const aadEmail = msalResponse.account.username.toLowerCase();
        if (aadEmail !== email.toLowerCase()) {
            setErrorMessage(
            `You must sign in with ${email}, but you used ${aadEmail}.`
            );
            return; // stop here
        }
    //   console.log('MSAL Login Response:', msalResponse);

      // Use the access token from the login response directly
      // or acquire it using the same scopes as the login request
      let accessToken;
      
      try {
        // Try to get token silently first
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: msalResponse.account
        });
        accessToken = tokenResponse.accessToken;
      } catch (error) {
        // console.log('Silent token acquisition failed, using login response token');
        // If silent acquisition fails, use the access token from login response
        accessToken = msalResponse.accessToken;
      }

    //   console.log('Access Token:', accessToken);

      const account = msalResponse.account;
    //   console.log('MSAL Account:', account);

    //   console.log('Calling api/login/microsoft...')
      
      // 3. Send token to your backend for user details
        let finalUser;
        try {
                finalUser = await loginAPI.authenticateToken(accessToken, selectedRole, selectedSystem.system_id);
            // console.log('Backend returned:', finalUser);
        } catch (err) {
            console.error('Token auth failed:', err);
            setErrorMessage(err.message || 'Server rejected your token.');
            return;
        }

    //   console.log('Response from api/login/microsoft', finalUser.email);
        // console.log(finalUser.system);
      // 4. Use your existing AuthProvider login
      login(
        accessToken,
        finalUser.userId,
        finalUser.firstName,
        finalUser.lastName,
        finalUser.email,
        finalUser.role,
        finalUser.system,
        mappedRole
      );
      
      localStorage.setItem('LOGIN_TYPE', 'microsoft');
      navigate("/home");
      
    } catch (err) {
        console.error("Login error:", err);
        console.error("Error details:", err?.response?.data);
        setErrorMessage(err?.response?.data?.error || err.message || "Access denied or login failed.");
    }
};

    useEffect(() => {
        const token = localStorage.getItem(JWT_TOKEN_KEY);
        if (token) navigate("/home");
    }, [navigate]);

    useEffect(() => {
        const fetchSystems = async () => {
        try {
            const systemsData = await systemAPI.getAllSystems();
            setSystems(systemsData);
        } catch (error) {
            console.error('Error fetching systems:', error);
            setError('Failed to load systems.');
        }
        };
        fetchSystems();
    }, []);

    // useEffect(() => {
    //     const checkAuth = async () => {
    //         const loggedIn = await isLoggedIn();
    //         if (loggedIn) {
    //             navigate("/home");
    //         }
    //     }
    //     checkAuth();
    // }, [navigate])

    
    const handleRoleSelection = (selectedRole, mappedRole) => {
        setSelectedRole(selectedRole);
        setMappedRole(mappedRole);
    };


    // For Local Login handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !selectedRole) {
            setErrorMessage('Please fill out all fields.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await loginAPI.loginUser(selectedRole, email, password);

            if (response.authenticated) {
                login(response.token, response.user_id, response.first_name, response.last_name, response.email, selectedRole);
                console.log('user id', response.user_id)
                navigate("/home");
            } else {
                setErrorMessage('Authentication failed');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="navbar unauth_navbar">
                <div className="navbar__center">
                    { (!selectedSystem) ? (
                    <a href="/" className="mx-auto text-center navbar-brand text-white ml-10 cmap">
                            CMAP&nbsp;<sup><small>SM</small></sup>&nbsp;Case Management Application Platform
                    </a>
                    ):( 
                    <a href="/" className="mx-auto text-center navbar-brand text-white ml-10 cmap">
                            CMAP&nbsp;<sup><small>SM</small></sup>&nbsp; - {selectedSystem.name}
                    </a>)}
                </div>   
            </div>
            {selectedSystem && selectedSystem.name!='PRISM' && <h1 className="system_name mt-4">{selectedSystem.full_name} ({selectedSystem.name})</h1>}
            {selectedSystem && selectedSystem.name=='PRISM' && <h1 className="system_name mt-4">{selectedSystem.full_name}</h1>}
            {selectedSystem && selectedSystem.name=='PRISM' && <h2 className="system_name">({selectedSystem.name})</h2>}


            {/* Step 1: Select System */}
            {(!selectedSystem)? (
            <div>
                <div 
                    className="global-admin"
                    style={{ 
                        position: 'fixed', 
                        top: '100px', 
                        right: '20px', 
                        cursor: 'pointer',
                        backgroundColor: '#ffd966',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 1000
                    }}
                    title="Login as Global Admin"
                    onClick={() => {
                        setIsGlobalAdmin(true);
                        setSelectedRole('Global Admin');
                        setMappedRole('GLOBAL_ADMIN');
                        setSelectedSystem({ system_id: 0, name: 'CMAP', full_name: 'Case Management Application Platform' });
                    }}
                >
                    <ConfigSpecialistIcon style={{ fontSize: '28px', color: '#555' }} />
                </div>
                <div className="text-center">
                    <span className="login_as">Select System</span>
                    <div className="system-selection">
                        {[
                            [2, 4],
                            [1, 3],
                            [5]
                        ].map((group, groupIndex) => (
                            <div key={groupIndex} className="system-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                {group.map(systemId => {
                                    const system = systems.find(sys => sys.system_id === systemId);
                                    if (!system) return null;
                                    const index = systems.findIndex(sys => sys.system_id === systemId);
                                    const bgColor = tileColors[index % tileColors.length];
                                    return (
                                        <div
                                            key={system.system_id}
                                            className="system-tile"
                                            onClick={() => setSelectedSystem(system)}
                                            style={{ cursor: "pointer", backgroundColor: bgColor, margin: '0 10px' }}
                                        >
                                            <SystemIcon style={{ position: 'absolute', top: 5, left: 5, fontSize: '18px', color: '#555' }} />
                                            <h5>{system.name}</h5>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>


            </div>
            ) : !selectedRole && !isGlobalAdmin ? (
                <div>
                <div className="login-back-button">
                    <BackButton onClick={() => setSelectedSystem(null)} label="Systems" />
                </div>
                <div className="text-center">
                    {/* <span className="system_name">{selectedSystem.name}</span><br/> */}
                    <span className="login_as">Login as</span>
                    <div className="role-selection">
                            {selectedSystem.roles.map((role) => {
                                console.log(role);
                                const roleInfo = roleIconMap[role.mappedRole];
                                if (!roleInfo) return null; // skip unknown roles
                                const { Icon, className } = roleInfo;
                                return (
                                <div
                                    key={role.mappedRole}
                                    className={`role-tile ${className}`}
                                    onClick={() => handleRoleSelection(role.displayName, role.mappedRole)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <Icon className={className} fontSize="large" />
                                    <h2>{role.displayName}</h2>
                                </div>
                                );
                            })}

                        {/* <div className="role-tile embassy_user" onClick={() => handleRoleSelection(USER_ROLES.APP_USER)}>
                            <EmbassyUserIcon className="embassy_user" fontSize="large"/>
                            <h2>Embassy User</h2>
                        </div>
                        <div className="role-tile approver" onClick={() => handleRoleSelection(USER_ROLES.SUPERVISOR)}>
                            <ApproverIcon className="approver" fontSize="large"/>
                            <h2>Approver</h2>
                        </div>
                        <div className="role-tile confirmation_user" onClick={() => handleRoleSelection(USER_ROLES.CONFIRMATION_USER)}>
                            <ConfirmationUserIcon className="confirmation_user" fontSize="large"/>
                            <h2>Confirmation User</h2>
                        </div>
                        <div className="role-tile admin" onClick={() => handleRoleSelection(USER_ROLES.LOCAL_ADMIN)}>
                            <AdminIcon className="admin" fontSize="large" />
                            <h2>Admin</h2>
                        </div>
                        <div className="role-tile config_specialist" onClick={() => handleRoleSelection(USER_ROLES.GLOBAL_ADMIN)}>
                            <ConfigSpecialistIcon className="config_specialist" fontSize="large"/>
                            <h2>Configuration Specialist</h2>
                        </div> */}
                    </div>
                </div>
                </div>
            ) : (
                <div className="login-form-container">
                    <div className="login-back-button">
                        {!setIsGlobalAdmin ? (
                            <BackButton onClick={() => setSelectedRole(null)} label="Roles" />
                        ) : (
                            <BackButton onClick={() => {setIsGlobalAdmin(false); setSelectedSystem(null); setSelectedRole(null);}} label="Systems" />
                        )}
                    </div>
                    <h3>{formatUserRole(selectedRole)} Login</h3>
                        <Box
                            className="p-3"
                            style={{
                                border: "2px solid red",
                                borderRadius: "2px",
                                backgroundColor: "#fff",
                                textAlign: "left",
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
                                YOU ARE ENTERING A SECURE SYSTEM
                            </Typography>
                            <Typography sx={{ fontSize: '13px', lineHeight: 1.2 }} color="text.secondary">
                                This Is A CMAP Computer System. This Computer System, Including All Related Equipment, Networks And Network Devices (Specifically Including Internet Access), Are Provided Only For Authorized U.S. Government Use. CMAP Computer Systems May Be Monitored For All Lawful Purposes, Including To Ensure That Their Use Is Authorized, For Management Of The System, To Facilitate Protection Against Unauthorized Access, And To Verify Security Procedures, Survivability And Operational Security. Monitoring Includes Active Attacks By Authorized CMAP Entities To Test Or Verify The Security Of This System. During Monitoring, Information May Be Examined, Recorded, Copied And Used For Authorized Purposes. All Information, Including Personal Information, Placed On Or Sent Over This System May Be Monitored. Use Of This CMAP Computer System, Authorized Or Unauthorized, Constitutes Consent To Monitoring Of This System. Unauthorized Use May Subject You To Criminal Prosecution. Evidence Of Unauthorized Use Collected During Monitoring May Be Used For Administrative, Criminal Or Other Adverse Action. Use Of This System Constitutes Consent To Monitoring For These Purposes.
                            </Typography>
                            <Typography sx={{ fontSize: '13px', marginTop: '5px', lineHeight: 1.2, fontWeight: 'bolder' }} color="text.secondary">
                                You are about to enter the secured website.<br /><br />
                            </Typography>
                            <Box textAlign="center">
                                <form className="login-form">
                                    <div className="login-form-group">
                                        <label htmlFor="email">Enter your Email ID</label>
                                        <div className="email-login-container">
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="email-input"
                                                required
                                            />
                                            <button type="button" onClick={handleValidateAndLogin} className="ms-btn login-button" disabled={inProgress !== "none"}>
                                                {!inProgress ? 'Signing you in...' : 'Sign in with Microsoft'}
                                            </button>
                                        </div>
                                    </div>
                                    {/* <div className="login-form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div> */}
                                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                                    {/* <button type="submit" className="login-button" disabled={isLoading}>
                                        {isLoading ? 'Loading...' : 'Login'}
                                    </button> */}
                                </form>
                            </Box>
                        </Box>


                </div>
            )}
        </div>
    );
};

export default Login;