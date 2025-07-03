import * as React from 'react';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { NeutralConnector, CustomStepIcon, StepLabelContent, } from './StepperCommon';

import FileUploadIcon from '@mui/icons-material/FileUpload';
import VerifiedIcon from '@mui/icons-material/Verified';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import EditDocumentIcon from '@mui/icons-material/EditDocument';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Typography } from '@mui/material';

const stageConfig = [
  {
    role: 'EMBASSY USER',
    description: 'Create Visit Request',
    accessible: false,
    icon: <EditDocumentIcon />,
  },
  {
    role: 'EMBASSY USER',
    description: 'Submit Visit Request',
    accessible: false,
    icon: <FileUploadIcon />,
  },
  {
    role: 'APPROVER',
    description: 'Review Visit Request',
    accessible: false,
    icon: <AssignmentIcon />,
  },
  {
    role: 'APPROVER',
    description: 'Process Visit Request',
    accessible: false,
    icon: <VerifiedIcon />,
  },
  {
    role: 'CONFIRMATION USER',
    description: 'Record Visit Status',
    accessible: true,
    icon: <DoneAllIcon />,
  },
];

export default function ConfirmationUserStepper({currentStageIndex}) {

  return (
    <Stack sx={{ width: '100%', position: 'fixed', zIndex: '998', backgroundColor: 'white'}} marginTop={'10px'} spacing={3}>
      <Typography variant="h4" sx={{textAlign: "center", marginTop:'0px', marginBottom:'0px', fontSize: '35px', fontWeight: '500'}}>Step 5. Record Visit Status</Typography>
      <Stepper alternativeLabel activeStep={currentStageIndex} connector={<NeutralConnector />}>
        {stageConfig.map((stage, index) => (
          <Step key={`${stage.role}-${stage.description}`} completed={index < currentStageIndex}>
            <StepLabel
              StepIconComponent={() =>
                CustomStepIcon({
                  icon: stage.icon,
                  active: index === currentStageIndex,
                  completed: index < currentStageIndex,
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
      {/* <hr/> */}
    </Stack>
  );
}
