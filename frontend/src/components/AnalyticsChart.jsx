import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

export const AnalyticsChart = ({ data, title = 'Chart'  }) => {
  const theme = useTheme();
  
  // Using theme colors for better consistency
  const COLORS = [
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.primary.main
  ];
  
  const STATUS_COLORS = {
    'Not Started': theme.palette.warning.main,
    'In Progress': theme.palette.info.main,
    'Submitted': theme.palette.success.main,
    'Not Reviewed': theme.palette.info.main,
    'Approved': theme.palette.success.main,
    'Not Approved': theme.palette.warning.main
  };
  
  // const chartData = [
  //   { name: 'Not Started', value: data.not_started || 0 },
  //   { name: 'In Progress', value: data.in_progress || 0 },
  //   { name: 'Submitted', value: data.submitted || 0 },
  // ];

  return (
    <Box sx={{ 
      mb: 4,
      p: 3,
      borderRadius: 2,
      bgcolor: 'background.paper',
      boxShadow: 1
    }}>
      <Typography 
        variant="h6" 
        component="h3" 
        gutterBottom 
        sx={{
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      
      <Box sx={{ 
        height: 400,
        width: 350,
        position: 'relative',
        '& .recharts-legend-item-text': {
          color: `${theme.palette.text.primary} !important`
        }
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.name] || theme.palette.grey[400]} 
                  stroke={theme.palette.background.paper}
                />
              ))}
            </Pie>
            <Legend 
              iconSize={16}
              wrapperStyle={{
                paddingTop: '20px'
              }}
              formatter={(value) => (
                <Typography 
                  variant="body2"
                  component="span"
                  sx={{ color: 'text.primary' }}
                >
                  {value}
                </Typography>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};