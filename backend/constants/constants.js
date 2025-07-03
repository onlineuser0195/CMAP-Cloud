
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
    fname : 1,
    mi: 70728,
    lname : 2,
    sdate : 986680,
    edate : 121215,
    passport : 581995,
    site : 734955,
    purpose: 210809
};

export const FVS_SYSTEM = {
    SYSTEM_ID: 2,
    FORM_ID: 9,
};

export const PRISM_SYSTEM = {
    SYSTEM_ID: 5,
    FORM_ID: 11,
};

export const PRISM_FIELD_MAPPING = {
    projectName : 676690,
    projectStatus: 545450,
    projectType : 778866,
    plannedStartDate: 252553,
    plannedEndDate: 958285,
    actualStartDate: 604531,
    actualEndDate: 364270,
    governmentLead: 76181
};
