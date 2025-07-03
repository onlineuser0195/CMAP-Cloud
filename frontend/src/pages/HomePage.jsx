import { USER_ROLES } from "../constants/constants";
import AdminDashboard from '../layouts/admin/AdminDashboard';
import SupervisorDashboard from '../layouts/supervisor/SupervisorDashboard';
import UserDashboard from '../layouts/user/UserDashboard';
import ConfirmationUserDashboard from "../layouts/confirmation_user/ConfirmationUserDashboard";
import Login from "./Login";
import useAuth from "../hooks/AuthContext";
import FvsAdminDashboard from "../layouts/fvs_admin/FvsAdminDashboard";
import DefaultDashboard from "../layouts/DefaultDashboard";
import { useNavigate } from 'react-router-dom';
import { SystemDashboardPage } from "./SystemDashboardPage";
import IndustryApplicantUserDashboard from "../elisa/layouts/industry-applicant-user/IndustryApplicantUserDashboard";
import SpanSupportUserDashboard from "../elisa/layouts/span-support-user/SpanSupportUserDashboard";
import ITUserDashboard from "../elisa/layouts/it-user/ITUserDashboard";
import { PrismDashboardPage } from "../prism/pages/PrismDashboardPage";
import PODashboard from "../prism/layouts/portfolio_owner/PODashboard";
import { DisclamerPage } from "./DisclamerPage";

const HomePage = () => {
    const { mappedRole, system } = useAuth();
    const navigate = useNavigate();

    // const [role, setUserRole] = useState(null);
    // const navigate = useNavigate();

    // useEffect(() => {
    //     const userRole = localStorage.getItem(USER_ROLE_KEY);
    //     setUserRole(userRole);
    //     console.log('Home Page role -',userRole)
    //     console.log('Home Page role -',role)
    //     // If the role is not found or invalid, redirect to the login page
    //     if (!userRole) {
    //         navigate('/login');
    //     }
    // }, [navigate]);
    console.log(mappedRole)
    switch (mappedRole) {
        case USER_ROLES.APP_USER:
            // navigate(`/system-dashboard/${system}`);
            return <DisclamerPage systemId={system}  />;

        case USER_ROLES.SUPERVISOR:
            // return <SupervisorDashboard />;
            return <DisclamerPage systemId={system}  />;

        case USER_ROLES.CONFIRMATION_USER:
            return <DisclamerPage systemId={system} />;

        case USER_ROLES.VIEWER:
            return <DisclamerPage systemId={system} />;

        case USER_ROLES.LOCAL_ADMIN:
            return <DisclamerPage systemId={system} />;

        case USER_ROLES.GLOBAL_ADMIN:
            return <AdminDashboard />;

        case USER_ROLES.CUSTOM:
            return <DefaultDashboard />;

        case USER_ROLES.INDUSTRY_APPLICANT:
            return <DisclamerPage systemId={system} />;

        case USER_ROLES.SPAN_SUPPORT_USER:
            return <DisclamerPage systemId={system} />;

        case USER_ROLES.IT_USER:
            return <DisclamerPage systemId={system} />;

        case USER_ROLES.PROJECT_MANAGER:
            // navigate(`/system-dashboard/${system}`);
            return <DisclamerPage systemId={system}  />;

        case USER_ROLES.GOVERNMENT_LEAD:
            // navigate(`/system-dashboard/${system}`);
            return <DisclamerPage systemId={system}  />;
        
        case USER_ROLES.PORTFOLIO_OWNER:
            // navigate(`/system-dashboard/${system}`);
            return <DisclamerPage systemId={system}/>;

        default:
            return <Login />;
    }
};

export default HomePage;