import * as React from 'react';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { NeutralConnector, CustomStepIcon, StepLabelContent, } from './StepperCommon';

import DashboardIcon from '@mui/icons-material/Dashboard';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { Typography } from '@mui/material';

export default function EmbassyUserStepper({ currentStageIndex, submissionStatus, approvalStatus }) {
  const getCreationStage = () => ({
      role: 'EMBASSY USER',
      description: 'Create Visit Request',
      accessible: true,
      icon: <EditDocumentIcon />,
  });

  const getSubmissionStage = () => ({
    role: 'EMBASSY USER',
    description: 'Submit Visit Request',
    accessible: true,
    icon: <FileUploadIcon />,
  });

  const getApprovalStage = () => {
    if (approvalStatus === 'approved') {
      return {
        role: 'APPROVER',
        description: 'Process Visit Request',
        icon: <VerifiedIcon />,
      };
    } else if (approvalStatus === 'rejected') {
      return {
        role: 'APPROVER',
        description: 'Process Visit Request',
        icon: <CloseIcon />,
      };
    } else {
      return {
        role: 'APPROVER',
        description: 'Process Visit Request',
        icon: <AssignmentTurnedInIcon />,
      };
    }
  };

  const stageConfig = [
    getCreationStage(),
    getSubmissionStage(),
    {
      role: 'APPROVER',
      description: 'Review Visit Request',
      accessible: false,
      icon: <QueryBuilderIcon />,
    },
    {
      ...getApprovalStage(),
      accessible: false,
    },
    {
      role: 'CONFIRMATION USER',
      description: 'Record Visit Status',
      accessible: false,
      icon: <DoneAllIcon />,
    },
  ];

  const getStepperHeading = (index, submissionStatus, approvalStatus) => {
    let heading = "";
    if (index == 0) {
      heading = "Create Visit Request";
    } else if (index == 1) {
      heading = "Submit Visit Request";
    } else if (index == 2) {
      heading = "Review Visit Request";
    } else if (index == 3) {
      heading = "Process Visit Request";
    }

    return `Step ${index + 1}. ${heading}`;
  };

  const getCompletedStatus = (index, currentStageIndex, approvalStatus) => {
    if (index == 3 && approvalStatus != "") {
      return true;
    }
    return index < currentStageIndex;
  };

  return (
    <Stack sx={{ width: '100%', position: 'fixed', zIndex: '998',backgroundColor: 'white', marginBottom: '0px'}} spacing={1} marginTop={'0px'}>
         {/* position: 'fixed', zIndex: '1000', backgroundColor: 'white', marginBottom: '100px' */}
      <Typography sx={{marginTop:'0px', fontSize: '32px', fontWeight: '500'}} >{getStepperHeading(currentStageIndex, submissionStatus, approvalStatus)}</Typography>

      <Stepper className='embassy-stepper' alternativeLabel activeStep={currentStageIndex} connector={<NeutralConnector />}>
        {stageConfig.map((stage, index) => (
          <Step key={`${stage.role}-${stage.description}`} completed={index < currentStageIndex}>
            <StepLabel
              StepIconComponent={() =>
                CustomStepIcon({
                  icon: stage.icon,
                  active: index === currentStageIndex,
                  completed: getCompletedStatus(index, currentStageIndex, approvalStatus),
                  accessible: stage.accessible,
                })
              }
            >
              <StepLabelContent
                role={stage.role}
                description={stage.description}
                accessible={index === currentStageIndex}
                stepNumber={index+1}
              />
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      <hr/>
    </Stack>
  );
}
