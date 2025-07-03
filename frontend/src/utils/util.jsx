import { USER_ROLES } from "../constants/constants";

export const formatUserRole = (role) => {
    const roleMap = {
        [USER_ROLES.LOCAL_ADMIN]: 'Configuration Specialist',
        [USER_ROLES.VIEWER]: 'Viewer',
        [USER_ROLES.CONFIRMATION_USER]: 'Confirmation User',
        [USER_ROLES.APP_USER]: 'Embassy User',
        [USER_ROLES.SUPERVISOR]: 'Approver',
        [USER_ROLES.GLOBAL_ADMIN]: 'Global Admin'
    };

    return roleMap[role] || role;
}

// YYYY-MM-DD to M/D/YYYY format
export const formatDate = (dateString) => {
    if (dateString) {
        const [year, month, day] = dateString.split('-');
        return `${parseInt(month)}/${parseInt(day)}/${year}`;
    }
    return ""
};