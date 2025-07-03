// api host
export const API_URL = 'https://cmap-backend.azurewebsites.net';

// local storage keys
export const JWT_TOKEN_KEY = 'jwt_token';
export const USER_ROLE_KEY = 'role';
export const MAPPED_ROLE_KEY = 'mapped_role';
export const EXPIRATION_TIME_KEY = 'expiration_time';
export const USER_ID_KEY = 'u_id';
export const USER_FIRST_NAME_KEY = 'f_name';
export const USER_LAST_NAME_KEY = 'l_name';
export const USER_EMAIL_KEY = 'email';
export const USER_SYSTEM = 'system';

// user roles
export const USER_ROLES = {
    APP_USER: "APP_USER",
    SUPERVISOR: "SUPERVISOR",
    CONFIRMATION_USER: "CONFIRMATION_USER",
    GLOBAL_ADMIN: "GLOBAL_ADMIN",
    LOCAL_ADMIN: "LOCAL_ADMIN",
    VIEWER: 'VIEWER',
    IT_USER: 'IT_USER',
    SPAN_SUPPORT_USER: 'SPAN_SUPPORT_USER',
    INDUSTRY_APPLICANT: 'INDUSTRY_APPLICANT',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    GOVERNMENT_LEAD: 'GOVERNMENT_LEAD',
    PORTFOLIO_OWNER: 'PORTFOLIO_OWNER',
    CUSTOM: "CUSTOM"
};

export const FVS_FIELD_MAPPING_CSV = {
    'First Name': '1',
    'Middle Initials': '70728',
    'Last Name': '2',
    'Start Date': '986680',
    'End Date': '121215',
    'Passport Number': '581995',
    'Facility Location': '734955',
    'Purpose of Visit': '210809'
};

export const FVS_FIELD_MAPPING = {
    fname : '1',
    mi: '70728',
    lname : '2',
    sdate : '986680',
    edate : '121215',
    passport : '581995',
    site : '734955',
    purpose: '210809'
};

export const TRIMMED_ID = 5;

export const PRISM_FIELD_MAPPING = {
    projectName : 676690,
    projectStatus: 545450,
    projectType : 778866,
    plannedStartDate: 252553,
    plannedEndDate: 958285,
    governmentLead: 76181,
};

export const PRISM_PLANNED_FIELDS = {
    plannedStartDate: 252553,
    plannedEndDate: 958285,
    plannedCost: 31662,
    plannedM5Date: 560451,
    plannedM4Date: 867118,
    plannedM3Date: 109531,
    plannedM2Date: 13753,
    plannedM1Date: 510165

}

export const PRISM_ACTUAL_FIELDS = {
    actualStartDate: 604531,
    actualEndDate: 364270,
    actualCost: 913623,
    actualM5Date: 155304,
    actualM4Date: 279058,
    actualM3Date: 826872,
    actualM2Date: 742996,
    actualM1Date: 281533

}

