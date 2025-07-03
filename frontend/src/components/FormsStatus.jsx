import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams  } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Chip, Button, CircularProgress, Grid, Paper } from '@mui/material';
import { formAPI } from '../api/api';
import { SystemLayout } from './SystemLayout';
import { USER_ROLES } from '../constants/constants';
import useAuth from '../hooks/AuthContext';

export const FormsStatus = () => {
  const { systemId } = useParams();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || null;
  const approved = searchParams.get('approved') || null;
  // const finalStatus = status || null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userRole, mappedRole } = useAuth();   
  
  // const [role, setUserRole] = useState(null);

  const statusColors = {
    submitted: 'success',
    in_progress: 'info',
    not_started: 'warning',
    approved: 'success',
    not_approved: 'warning',
    not_assessed: 'info',
    not_reviewed: 'info'
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        // const response = await formAPI.getAllSystemForms(systemId || 0, finalStatus); // backend handles both modes
        const response = await formAPI.getAllSystemForms(systemId || 0, status, approved);
        console.log(response);
        setData(response);
      } catch (error) {
        console.error('Error fetching forms by status:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [status, approved, searchParams, systemId]);

  const getFilterLabel = () => {
    if (status) return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (approved) return approved.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return 'All Statuses';
  };

  if (loading) return <CircularProgress />;

  return (
    <SystemLayout systemId={systemId}>
      <Box p={3}>
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        {systemId ? data[0]?.system_name ?? 'System' : 'All Systems'} – {getFilterLabel()}
      </Typography>


        {/* System-specific view */}
        {systemId ? (
          <FormsList forms={data} statusColors = {statusColors} role={mappedRole} systemId={systemId}/>
        ) : (
          <Grid container spacing={3}>
            {data.map(systemGroup => (
              <Grid item xs={12} md={6} lg={4} key={systemGroup.system_id} >
                <Paper elevation={3} 
                    sx={{
                        p: 2,
                        height: '100%', // 💡 makes all cards in the row same height
                        display: 'flex',
                        flexDirection: 'column',
                        // justifyContent: 'space-between'
                      }}>
                <Box mb={2}>
                <Typography
                    variant="h6"
                    gutterBottom
                    noWrap // 💡 keep all cards same height even if name is long
                    sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                    }}
                >                    
                    {systemGroup.system_name}
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => 
                          window.location.href = 
                            `/systems/${systemGroup.system_id}/forms-status?` +
                            new URLSearchParams({
                              ...(status && { status }),
                              ...(approved && { approved })
                            }).toString()
                        // navigate(
                        //     status 
                        //     ? `/systems/${systemGroup.system_id}/forms-status/${status}` 
                        //     : `/systems/${systemGroup.system_id}/forms-status`
                        // )
                          // navigate(
                          //   `/systems/${systemGroup.system_id}/forms-status?` +
                          //   new URLSearchParams({
                          //     ...(status && { status }),
                          //     ...(approved && { approved })
                          //   }).toString(),
                          //   { replace: true } // For Refresh
                          // )
                        }
                        sx={{ ml: 2 }}
                        >
                        View in System
                    </Button>
                    </Box>
                    <Box>
                    {/* sx={{ maxHeight: 200, overflowY: 'auto' }} */}
                  <FormsList forms={systemGroup.forms} statusColors={statusColors} role={mappedRole} systemId = {systemGroup.system_id} />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </SystemLayout>
  );
};

const FormsList = ({ forms, statusColors, role, systemId }) => (
  <List>
    {forms.map((form, index) => {
      console.log(form);
      // const { systemId } = useParams();
      const navigate = useNavigate();
      const handleClick = () => {
        navigate(`/form-dashboard/${form.form_id}`, {
          state: systemId ? { systemId } : undefined,
        });
      };
      return (
        <ListItem key={form.form_id} divider>
          <ListItemText
            primary={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1">{index + 1}.</Typography>
                <Button
                  sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                  onClick={handleClick}
                >
                  {/*() => window.location.href = `/form-dashboard/${form.form_id}`*/}
                  {form.name}
                </Button>
                {role !== USER_ROLES.GLOBAL_ADMIN && <div>
                <Chip
                className="ml-10"
                label={`${form.progress.in_progress} In Progress`}
                size="small"
                color={statusColors['in_progress']}
                sx={{ mr: 2, ml: 2 }}/>
                <Chip
                className="ml-10"
                label={`${form.progress.submitted} Submitted`}
                size="small"
                color={statusColors['submitted']}
                sx={{ mr: 2, ml: 0 }}/>
                <Chip
                className="ml-10"
                label={`${form.approved.not_approved} Not Approved`}
                size="small"
                color={statusColors['not_approved']}
                sx={{ mr: 2, ml: 0 }}/>
                <Chip
                className="ml-10"
                label={`${form.approved.not_approved} Approved`}
                size="small"
                color={statusColors['approved']}
                sx={{ mr: 2, ml: 0 }}/>
                </div>}
              </Box>
            }
            secondary={
              role !== USER_ROLES.GLOBAL_ADMIN
                ? (form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : 'No updates yet')
                : null
            }
          />
        </ListItem>
      );
    })}
  </List>
);
