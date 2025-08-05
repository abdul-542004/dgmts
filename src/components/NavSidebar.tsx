import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from "../assets/logo.jpg"; 
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  Typography,
  useTheme,
  ListItemButton,
  Avatar
} from '@mui/material';
import {
  Folder as ProjectsIcon,
  Notifications as AlarmsIcon,
  ShowChart as GraphsIcon,
  InsertDriveFile as FileManagerIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  Summarize as SummaryIcon,
  ExitToApp as LogoutIcon,
  Person as UserIcon,
  VerifiedUser as AdminProfileIcon,
  AccountTree as ProjectIcon,
  Map as ProjectMapIcon,
  Assessment as SeismographIcon,
  RotateLeft as TiltmeterIcon,
  Timeline as PrismIcon
} from '@mui/icons-material';
import { useAdminContext } from '../context/AdminContext';
import { supabase } from '../supabase';
import { 
  SIDEBAR_PROJECT_IDS, 
  INSTRUMENT_ROUTE_MAP, 
  INSTRUMENT_ICON_MAP 
} from '../config/sidebarConfig';

// Configuration: Project IDs you want to show in sidebar
// Now imported from config file

// Types
interface DynamicProject {
  id: number;
  name: string;
  instruments: DynamicInstrument[];
}

interface DynamicInstrument {
  instrument_id: string;
  instrument_name: string;
  route_path: string;
  icon_type: string;
}

// Icon mapping function
const getInstrumentIcon = (iconType: string) => {
  switch (iconType.toLowerCase()) {
    case 'seismograph':
      return SeismographIcon;
    case 'tiltmeter':
      return TiltmeterIcon;
    case 'prism':
      return PrismIcon;
    default:
      return GraphsIcon;
  }
};

const NavSidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openGraphs, setOpenGraphs] = useState(false);
  const [openProjects, setOpenProjects] = useState<{ [key: number]: boolean }>({});
  const [dynamicProjects, setDynamicProjects] = useState<DynamicProject[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAdmin, setIsAdmin, userEmail, permissions } = useAdminContext();

  const fetchProjectsAndInstruments = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);

    try {
      // Fetch projects that user has access to from the configured list
      let accessibleProjectIds: number[] = [];

      if (isAdmin) {
        accessibleProjectIds = SIDEBAR_PROJECT_IDS;
      } else {
        // Check user access for each configured project
        const { data: userProjects, error } = await supabase
          .from('ProjectUsers')
          .select('project_id')
          .eq('user_email', userEmail)
          .in('project_id', SIDEBAR_PROJECT_IDS);
        
        if (error) throw error;
        accessibleProjectIds = userProjects?.map(up => up.project_id) || [];
      }

      if (accessibleProjectIds.length === 0) {
        setDynamicProjects([]);
        return;
      }

      // Fetch project details
      const { data: projects, error: projectsError } = await supabase
        .from('Projects')
        .select('id, name')
        .in('id', accessibleProjectIds);

      if (projectsError) throw projectsError;

      // Fetch instruments for accessible projects with their routes
      const projectsWithInstruments: DynamicProject[] = [];

      for (const project of projects || []) {
        const { data: instruments, error: instrumentsError } = await supabase
          .from('instruments')
          .select('instrument_id, instrument_name')
          .eq('project_id', project.id);

        if (instrumentsError) throw instrumentsError;

        const dynamicInstruments: DynamicInstrument[] = (instruments || []).map(instrument => ({
          instrument_id: instrument.instrument_id,
          instrument_name: instrument.instrument_name,
          route_path: getInstrumentRoute(instrument.instrument_id, instrument.instrument_name),
          icon_type: getInstrumentIconType(instrument.instrument_id, instrument.instrument_name)
        }));

        projectsWithInstruments.push({
          id: project.id,
          name: project.name,
          instruments: dynamicInstruments
        });
      }

      setDynamicProjects(projectsWithInstruments);
    } catch (error) {
      console.error('Error fetching projects and instruments:', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail, isAdmin]);

  useEffect(() => {
    fetchProjectsAndInstruments();
  }, [fetchProjectsAndInstruments]);

  // Helper function to determine route based on instrument
  const getInstrumentRoute = (instrumentId: string, instrumentName: string): string => {
    // Check configured route mapping first
    if (INSTRUMENT_ROUTE_MAP[instrumentId]) {
      return INSTRUMENT_ROUTE_MAP[instrumentId];
    }

    // Handle AMTS track and ref routes for Long Bridge project
    if (instrumentId.startsWith('AMTS')) {
      if (instrumentName.toLowerCase().includes('track')) {
        return '/amts-track-graphs';
      }
      if (instrumentName.toLowerCase().includes('ref')) {
        return '/amts-ref-graphs';
      }
      return '/single-prism-with-time';
    }

    // Default route or based on instrument type
    if (instrumentName.toLowerCase().includes('seismograph')) {
      return '/background'; // Default seismograph route
    }
    if (instrumentName.toLowerCase().includes('tiltmeter')) {
      return '/tiltmeter';
    }
    if (instrumentName.toLowerCase().includes('prism')) {
      return '/single-prism-with-time';
    }

    return '#'; // Fallback for unknown instruments
  };

  // Helper function to determine icon type
  const getInstrumentIconType = (instrumentId: string, instrumentName: string): string => {
    // Check configured icon mapping first
    for (const [prefix, iconType] of Object.entries(INSTRUMENT_ICON_MAP)) {
      if (instrumentId.startsWith(prefix)) {
        return iconType;
      }
    }

    // Fallback to name-based detection
    if (instrumentName.toLowerCase().includes('seismograph')) {
      return 'seismograph';
    }
    if (instrumentName.toLowerCase().includes('tiltmeter')) {
      return 'tiltmeter';
    }
    if (instrumentName.toLowerCase().includes('prism')) {
      return 'prism';
    }
    return 'default';
  };

  const handleGraphsClick = () => {
    setOpenGraphs(!openGraphs);
  };

  const handleProjectClick = (projectId: number) => {
    setOpenProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleLogout = async () => {
    localStorage.removeItem('jwtToken');
    setIsAdmin(false);
    navigate('/signin');
  };

  return (
 <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #fff', // Match the header's border
        },
      }}
    >
      <Box>
         <Box>
        {/* Updated header area with logo */}
        <Box sx={{  
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'white', // White background for logo area
          borderBottom: '1px solid #000' // Match header's border
        }}>
          <img
            src={logo}
            alt="DGMTS Logo"
            style={{ 
              height: '50px', 
              marginBottom: '-5px',
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'black', // Black text to match your header
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            DGMTS-imSite
          </Typography>
        </Box>
        
        {/* Rest of your existing sidebar content... */}
        <Divider />
      </Box>
        <List>
          {permissions.access_to_site && (
            <ListItemButton component={Link} to="/projects-list">
              <ListItemIcon sx={{ color: 'inherit' }}>
                <ProjectsIcon />
              </ListItemIcon>
              <ListItemText primary="Projects" />
            </ListItemButton>
          )}
          <ListItemButton component={Link} to="/alarms">
            <ListItemIcon sx={{ color: 'inherit' }}>
              <AlarmsIcon />
            </ListItemIcon>
            <ListItemText primary="Alarms" />
          </ListItemButton>

          {permissions.view_graph && (
            <>
              <ListItemButton onClick={handleGraphsClick}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <GraphsIcon />
                </ListItemIcon>
                <ListItemText primary="Graphs" />
                {openGraphs ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openGraphs} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ bgcolor: '#003087' }}>
                  <ListItemButton
                    component={Link}
                    to="/project-graphs"
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary="Project Graphs" />
                  </ListItemButton>
                  <ListItemButton
                    component={Link}
                    to="/view-custom-graphs"
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary="Custom Graphs" />
                  </ListItemButton>

                  {/* Dynamic Projects Section */}
                  {loading ? (
                    <ListItemButton sx={{ pl: 4 }}>
                      <ListItemText primary="Loading projects..." />
                    </ListItemButton>
                  ) : (
                    dynamicProjects.map((project) => (
                      <React.Fragment key={project.id}>
                        <ListItemButton onClick={() => handleProjectClick(project.id)} sx={{ pl: 4 }}>
                          <ListItemIcon sx={{ color: 'inherit', minWidth: '36px' }}>
                            <ProjectIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={project.name} />
                          {openProjects[project.id] ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={openProjects[project.id]} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding sx={{ bgcolor: '#002366' }}>
                            {project.instruments.map((instrument) => {
                              const IconComponent = getInstrumentIcon(instrument.icon_type);
                              return (
                                <ListItemButton
                                  key={instrument.instrument_id}
                                  component={Link}
                                  to={instrument.route_path}
                                  sx={{ pl: 6 }}
                                  disabled={instrument.route_path === '#'}
                                >
                                  <ListItemIcon sx={{ color: 'inherit', minWidth: '32px' }}>
                                    <IconComponent fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary={instrument.instrument_name} />
                                </ListItemButton>
                              );
                            })}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Collapse>
            </>
          )}
          {permissions.view_data && (
            <ListItemButton
              component={Link}
              to="/data-summary"
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <SummaryIcon />
              </ListItemIcon>
              <ListItemText primary="Data Summary" />
            </ListItemButton>
          )}

          <ListItemButton
            component={Link}
            to="/maps"
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <ProjectMapIcon />
            </ListItemIcon>
            <ListItemText primary="Maps" />
          </ListItemButton>
          {permissions.view_data && (
            <ListItemButton component={Link} to="/file-manager">
              <ListItemIcon sx={{ color: 'inherit' }}>
                <FileManagerIcon />
              </ListItemIcon>
              <ListItemText primary="File Manager" />
            </ListItemButton>
          )}


          {isAdmin && (
            <>
              <ListItemButton component={Link} to="/admin-setup">
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <AdminIcon />
                </ListItemIcon>
                <ListItemText primary="Admin Setup" />
              </ListItemButton>
              {/* <ListItemButton component={Link} to="/seismograph">
                <ListItemIcon sx={{ color: 'inherit' }}>
                </ListItemIcon>
                <ListItemText primary="Seismograph" />
                </ListItemButton> */}
            </>
          )}
        </List>
      </Box>

      <Box sx={{ pb: 2 }}>
        <Divider />
        <List>
          <ListItemButton>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <Avatar sx={{
                bgcolor: isAdmin ? theme.palette.secondary.main : theme.palette.info.main,
                width: 32,
                height: 32
              }}>
                {isAdmin ? <AdminProfileIcon fontSize="small" /> : <UserIcon fontSize="small" />}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={isAdmin ? "Admin" : "User"}
              secondary={userEmail || "Not logged in"}
            />
          </ListItemButton>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
};

export default NavSidebar;