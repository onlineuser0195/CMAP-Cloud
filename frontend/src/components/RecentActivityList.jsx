import React, { useState, useEffect } from 'react';
import { 
  Box,
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Typography, 
  Divider,
  Chip
} from '@mui/material';
import { 
  Assignment as FormIcon,
  CheckCircle as SubmittedIcon,
  Edit as InProgressIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

import { adminAPI } from '../api/api';

const statusIcons = {
  submitted: <SubmittedIcon color="success" />,
  in_progress: <InProgressIcon color="info" />,
  not_started: <FormIcon color="action" />
};

const statusColors = {
  submitted: 'success',
  in_progress: 'info',
  not_started: 'default'
};

const truncate = (str, max = 30) =>
  str.length > max ? str.slice(0, max) + '…' : str;

export const RecentActivityList = ({ activities }) => {
  return (
    <div>
      {/* <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography> */}
      <List sx={{ bgcolor: 'background.paper' }}>
        {activities.map((activity, index) => (
          <div key={activity._id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                {statusIcons[activity.progress]}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    <Typography variant="subtitle1" component="div" noWrap={false}>
                      {activity.form_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" 
                    sx={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                      {truncate(activity.system_name)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography 
                    component="div" 
                    variant="body2" 
                    color="textSecondary"
                  > &nbsp;
                    <Chip 
                      label={activity.progress.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      size="small"
                      color={statusColors[activity.progress]}
                      sx={{ mr: 1 }}
                    />- <UserDisplay userId={activity.user_id} /><br/>
                    {formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })}
                  </Typography>
                }
              />
            </ListItem>
            {index < activities.length - 1 && <Divider variant="inset" />}
          </div>
        ))}
      </List>
    </div>
  );
};

const UserDisplay = ({ userId }) => {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    adminAPI.getUser(userId)
      .then(res => setName(`${res.user.first_name} ${res.user.last_name}`))
      .catch(() => setName('Unknown User'));
  }, [userId]);

  return <>{name}</>;
};