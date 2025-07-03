import { FVS_FIELD_MAPPING, FVS_SYSTEM, PRISM_FIELD_MAPPING, PRISM_SYSTEM, USER_ROLES } from "../../constants/constants.js";
import ForeignVisitsSchema from "../../models/foreignVisits.js";
import { FormResponse } from "../../models/formResponse.js"


export const getAllProjectDetails = async (req, res) => {
    try {
        const formResponses = await FormResponse.find({
            form_id: PRISM_SYSTEM.FORM_ID,
            system_id: PRISM_SYSTEM.SYSTEM_ID
        }).lean();

        const responses = await Promise.all(
            formResponses.map(async (response) => {
                // Extract fields from the fields map
                const fieldMap = {
                    projectName: response.fields?.[String(PRISM_FIELD_MAPPING.projectName)],
                    projectType: response.fields?.[String(PRISM_FIELD_MAPPING.projectType)],
                    projectStatus: response.fields?.[String(PRISM_FIELD_MAPPING.projectStatus)],
                };

                return {
                    ...response,
                    project_name: fieldMap.projectName,
                    project_type: fieldMap.projectType,
                    project_status: fieldMap.projectStatus,
                };
            })
        );

        return res.status(200).json(responses);
    } catch (error) {
        console.error('Error fetching form responses:', error);
        return res.status(500).json({ message: 'Failed to get form responses' });
    }
};

export const getProjectStatusCount = async (req, res) => {
    try {
        const { userRole, userId } = req.params;

        if (!userId || !userRole) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const forms = await FormResponse.find({
            form_id: PRISM_SYSTEM.FORM_ID,
            system_id: PRISM_SYSTEM.SYSTEM_ID
        });

        let filteredForms = forms;
        if (userRole == USER_ROLES.PROJECT_MANAGER) {
            filteredForms = forms.filter((form) => form.created_by == userId);
        } else if (userRole == USER_ROLES.GOVERNMENT_LEAD) {
            const govLeadKey = PRISM_FIELD_MAPPING.governmentLead.toString();
            filteredForms = filteredForms.filter((resp) => {
                return resp?.fields?.get(govLeadKey)?.id == userId;
            });
        }

        const statusCounts = {};
        for (const form of filteredForms) {
            const status = form?.fields?.get(PRISM_FIELD_MAPPING.projectStatus.toString());
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }


        return res.status(200).json(statusCounts);
    } catch (error) {
        console.error('Error fetching project status:', error);
        return res.status(500).json({ message: 'Failed to get project status' });
    }
};

export const getProjectDataForGanttChart = async (req, res) => {
    try {
        const { userRole, userId } = req.params;

        if (!userId || !userRole) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const projects = await FormResponse.find({
            form_id: PRISM_SYSTEM.FORM_ID,
            system_id: PRISM_SYSTEM.SYSTEM_ID
        });

        let filteredProjects = projects;
        if (userRole == USER_ROLES.PROJECT_MANAGER) {
            filteredProjects = projects.filter((proj) => proj.created_by == userId);
        } else if (userRole == USER_ROLES.GOVERNMENT_LEAD) {
            const govLeadKey = PRISM_FIELD_MAPPING.governmentLead.toString();
            filteredProjects = filteredProjects.filter((resp) => {
                return resp?.fields?.get(govLeadKey)?.id == userId;
            });
        }

        const tasks = [];
        filteredProjects.forEach((project) => {
            const { _id, fields } = project;

            const projectName = fields?.get(PRISM_FIELD_MAPPING.projectName.toString());
            const plannedStartDate = fields?.get(PRISM_FIELD_MAPPING.plannedStartDate.toString());
            const plannedEndDate = fields?.get(PRISM_FIELD_MAPPING.plannedEndDate.toString());
            const actualStartDate = fields?.get(PRISM_FIELD_MAPPING.actualStartDate.toString());
            const actualEndDate = fields?.get(PRISM_FIELD_MAPPING.actualEndDate.toString());

            tasks.push({
                id: `${_id}-planned`,
                name: `${projectName} (Planned)`,
                start: plannedStartDate,
                end: plannedEndDate,
                dependencies: '',
                custom_class: 'planned',
            });

            if (actualStartDate) {
                const isCompleted = !!actualEndDate;
                tasks.push({
                    id: `${_id}-actual`,
                    name: `${projectName} (Actual) - ${isCompleted ? 'Completed' : 'In Progress'}`,
                    start: actualStartDate,
                    end: actualEndDate || null,
                    dependencies: '',
                    custom_class: isCompleted ? 'actual-completed' : 'actual-in-progress',
                });
            }
        });

        return res.status(200).json(tasks);

    } catch (error) {
        console.error('Error fetching project data:', error);
        return res.status(500).json({ message: 'Failed to get project data' });
    }
};
