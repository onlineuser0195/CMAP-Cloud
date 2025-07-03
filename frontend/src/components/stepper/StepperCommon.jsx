// StepperCommon.jsx
import React from 'react';
import { styled } from '@mui/material/styles';
import { StepConnector, stepConnectorClasses, Box, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

export const NeutralConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 5,
        left: 'calc(-50% + 15px)',
        right: 'calc(50% + 15px)',
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 2,
        border: 0,
        borderRadius: 1,
        backgroundColor: '#e0e0e0',
    },
    [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
        backgroundColor: 'rgb(13, 92, 17)',
    },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
        backgroundColor: 'rgb(13, 92, 17)',
    },
}));

export const StepIconWrapper = styled('div')(() => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    fontSize: 16,
    transition: 'all 0.3s ease-in-out',
    width: 40,
    height: 10,
    borderRadius: '50%',
}));

export function CustomStepIcon({ icon, active, completed, accessible }) {
    let borderStyle = 'none';
    if (completed) borderStyle = '2px solid rgb(13, 92, 17) ';
    else if (active) borderStyle = '2px solid rgb(138, 107, 5)';

    const circleStyle = {
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: completed ?
            '#4caf50'
            : active
                ? '#fcba03'
                : '#e0e0e0',
        color: accessible ? '#fff' : '#9e9e9e',
        border: borderStyle,
        boxShadow: active && accessible ? '0 6px 6px rgba(0,0,0,0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const iconStyle = {
        color: completed || active ? '#fff' : '#9e9e9e',
        fontSize: 20,
    };

    return (
        <StepIconWrapper>
            <div style={circleStyle}>
                {React.cloneElement(icon, { style: iconStyle })}
            </div>
            {completed && (
                <CheckIcon
                    style={{
                        position: 'absolute',
                        top: -23,
                        right: -20,
                        background: '#fff',
                        color: 'green',
                        borderRadius: '50%',
                        fontSize: 28,
                        marginBottom: 0,
                        border: '0px solid green',
                    }}
                />
            )}
        </StepIconWrapper>
    );
}

export function StepLabelContent({ role, description, accessible, stepNumber }) {
    return (
        <Box sx={{ textAlign: 'center', mt: 0, mb:0, pt: 0 }}>
            <Typography
                variant="caption"
                sx={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.2, display: 'block' }}
                color={accessible ? 'text.primary' : 'text.disabled'}
            >
                Step {stepNumber}
            </Typography>
            <Typography
                variant="caption"
                sx={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.2 }}
                color={accessible ? 'text.primary' : 'text.disabled'}
            >
                {description}
            </Typography>
            <Typography
                variant="caption"
                sx={{ display: 'block', fontSize: '14px', lineHeight: 1.2 }}
                color={accessible ? 'text.primary' : 'text.disabled'}
            >
                {role}
            </Typography>
        </Box>
    );
}