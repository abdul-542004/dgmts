import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Box, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Checkbox, FormControlLabel, FormGroup, TextField,
  Autocomplete, Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { supabase } from '../supabase';
import HeaNavLogo from '../components/HeaNavLogo';
import MainContentWrapper from '../components/MainContentWrapper';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { useAdminContext } from '../context/AdminContext';

type User = {
  id: string;
  sno: number;
  username: string;
  email: string;
  Company: string;
  Position: string;
  'Phone No': string;
  access_to_site?: boolean;
  view_graph?: boolean;
  download_graph?: boolean;
  view_data?: boolean;
  download_data?: boolean;
};

type Project = {
  id: number;
  name: string;
};

const Permissions: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState({
    access_to_site: false,
    view_graph: false,
    download_graph: false,
    view_data: false,
    download_data: false
  });
  // Add state for user-projects and delete dialog
  const [userProjects, setUserProjects] = useState<{ [email: string]: string[] }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Add state for editing user details
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: '',
    email: '',
    Company: '',
    Position: '',
    'Phone No': ''
  });

  // Add state for projects
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedUserProjects, setSelectedUserProjects] = useState<Project[]>([]);

  const { isAdmin, userEmail } = useAdminContext();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const usersWithSno = data?.map((user, index) => ({
          ...user,
          sno: index + 1
        })) || [];

        setUsers(usersWithSno);
        
        // Fetch all projects for the dropdown
        const { data: projectsData, error: projectsError } = await supabase
          .from('Projects')
          .select('id, name')
          .order('name', { ascending: true });
        
        if (projectsError) throw projectsError;
        setAllProjects(projectsData || []);
        
        // Fetch user-project assignments
        const { data: projectUsers, error: puError } = await supabase
          .from('ProjectUsers')
          .select('user_email, project_id, Projects(name)');
        if (puError) throw puError;
        // Map user_email to array of project names
        const projMap: { [email: string]: string[] } = {};
        (projectUsers || []).forEach((pu) => {
          if (!pu.user_email) return;
          if (!projMap[pu.user_email]) projMap[pu.user_email] = [];
          if (pu.Projects && typeof pu.Projects === 'object' && 'name' in pu.Projects) {
            projMap[pu.user_email].push(String(pu.Projects.name));
          }
        });
        setUserProjects(projMap);
      } catch (error) {
        console.error('Error fetching users or projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEditClick = (user: User) => {
    setCurrentUser(user);
    setPermissions({
      access_to_site: user.access_to_site || false,
      view_graph: user.view_graph || false,
      download_graph: user.download_graph || false,
      view_data: user.view_data || false,
      download_data: user.download_data || false
    });
    setEditDialogOpen(true);
  };

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPermissions({
      ...permissions,
      [e.target.name]: e.target.checked
    });
  };

  const handleSaveChanges = async () => {
    if (!currentUser) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update(permissions)
        .eq('id', currentUser.id);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === currentUser.id ? { ...user, ...permissions } : user
      ));

      setEditDialogOpen(false);
    toast.success('Permissions updated successfully for ' + currentUser.username);
    } catch (error) {
      console.error('Error updating permissions:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('Error updating permissions: ' + errorMessage);
    }
  };

  const handleEditUserClick = (user: User) => {
    setCurrentUser(user);
    setUserDetails({
      username: user.username || '',
      email: user.email || '',
      Company: user.Company || '',
      Position: user.Position || '',
      'Phone No': user['Phone No'] || ''
    });
    
    // Set the currently assigned projects for this user
    const userProjectNames = userProjects[user.email] || [];
    const assignedProjects = allProjects.filter(project => 
      userProjectNames.includes(project.name)
    );
    setSelectedUserProjects(assignedProjects);
    
    setEditUserDialogOpen(true);
  };

  const handleUserDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDetails({
      ...userDetails,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveUserDetails = async () => {
    if (!currentUser) return;
    
    try {
      // Update user details
      const { error: userError } = await supabase
        .from('users')
        .update(userDetails)
        .eq('id', currentUser.id);

      if (userError) throw userError;

      // Check if project assignments have changed
      const currentUserProjectNames = userProjects[currentUser.email] || [];
      const newUserProjectNames = selectedUserProjects.map(p => p.name);
      
      // Sort both arrays to compare properly
      const currentSorted = [...currentUserProjectNames].sort();
      const newSorted = [...newUserProjectNames].sort();
      const projectsChanged = JSON.stringify(currentSorted) !== JSON.stringify(newSorted);

      // Only update project assignments if they've changed
      if (projectsChanged) {
        // First, delete existing project assignments for this user
        const { error: deleteError } = await supabase
          .from('ProjectUsers')
          .delete()
          .eq('user_email', userDetails.email);

        if (deleteError) throw deleteError;

        // Then, add new project assignments
        if (selectedUserProjects.length > 0) {
          const projectInserts = selectedUserProjects.map(project => ({
            project_id: project.id,
            user_email: userDetails.email
          }));

          const { error: insertError } = await supabase
            .from('ProjectUsers')
            .insert(projectInserts);

          if (insertError) throw insertError;
        }

        // Update userProjects state only if projects changed
        const updatedUserProjects = { ...userProjects };
        updatedUserProjects[userDetails.email] = selectedUserProjects.map(p => p.name);
        setUserProjects(updatedUserProjects);
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === currentUser.id ? { ...user, ...userDetails } : user
      ));

      setEditUserDialogOpen(false);
      toast.success(`User details updated successfully for ${currentUser.username}`);
    } catch (error) {
      console.error('Error updating user details:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('Error updating user details: ' + errorMessage);
    }
  };

  return (
    <>
      <HeaNavLogo />
      <MainContentWrapper>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            User Permissions
          </Typography>
          
          <TableContainer component={Paper} sx={{ border: '1px solid black' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f1f1f1' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Position</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Phone No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Projects</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Edit User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Edit Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', border: '1px solid black' }}>Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">Loading users...</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">No users found</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} sx={{ backgroundColor: '#fff' }}>
                      <TableCell sx={{ border: '1px solid black' }}>{user.sno}</TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>{user.username || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>{user.email}</TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>{user.Company || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>{user.Position || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>{user['Phone No'] || '-'}</TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>
                        {(user.email === userEmail && isAdmin) || user.username === 'admin' || user.email === 'admin' ? 'All' : (userProjects[user.email] || []).join(', ') || '-'}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleEditUserClick(user)}
                          sx={{ 
                            py: 1, 
                            fontSize: 14,
                            minWidth: 'auto',
                            px: 1
                          }}
                        >
                            <PersonIcon />
                        </Button>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleEditClick(user)}
                          sx={{ 
                            py: 1, 
                            fontSize: 14,
                            minWidth: 'auto',
                            px: 1
                          }}
                        >
                            <EditIcon />
                        </Button>
                      </TableCell>
                      <TableCell sx={{ border: '1px solid black' }}>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}
                          sx={{ 
                            py: 1, 
                            fontSize: 14,
                            minWidth: 'auto',
                            px: 1
                          }}
                        >
                            <DeleteIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Edit Permissions Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit User Permissions</DialogTitle>
          <DialogContent>
            {currentUser && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {currentUser.username} ({currentUser.email})
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.access_to_site}
                        onChange={handlePermissionChange}
                        name="access_to_site"
                      />
                    }
                    label="Access to Site"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.view_graph}
                        onChange={handlePermissionChange}
                        name="view_graph"
                      />
                    }
                    label="View Graph"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.download_graph}
                        onChange={handlePermissionChange}
                        name="download_graph"
                      />
                    }
                    label="Download Graph"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.view_data}
                        onChange={handlePermissionChange}
                        name="view_data"
                      />
                    }
                    label="View Data"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={permissions.download_data}
                        onChange={handlePermissionChange}
                        name="download_data"
                      />
                    }
                    label="Download Data"
                  />
                </FormGroup>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Details Dialog */}
        <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogContent>
            {currentUser && (
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Editing: {currentUser.username} ({currentUser.email})
                </Typography>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={userDetails.username}
                  onChange={handleUserDetailChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userDetails.email}
                  onChange={handleUserDetailChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Company"
                  name="Company"
                  value={userDetails.Company}
                  onChange={handleUserDetailChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Position"
                  name="Position"
                  value={userDetails.Position}
                  onChange={handleUserDetailChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="Phone No"
                  value={userDetails['Phone No']}
                  onChange={handleUserDetailChange}
                  margin="normal"
                />
                
                {/* Project Assignment Section */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                  Assign Projects
                </Typography>
                <Autocomplete
                  multiple
                  options={allProjects}
                  getOptionLabel={(option) => option.name}
                  value={selectedUserProjects}
                  onChange={(_event, newValue) => setSelectedUserProjects(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Projects"
                      placeholder="Choose projects to assign to this user"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Selected projects: {selectedUserProjects.length} project(s)
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUserDetails} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm User Deletion</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">Cancel</Button>
            <Button
              onClick={async () => {
                if (!userToDelete) return;
                setLoading(true);
                // Delete from ProjectUsers first
                const { error: puError } = await supabase
                  .from('ProjectUsers')
                  .delete()
                  .eq('user_email', userToDelete.email);
                // Delete from users
                const { error: userError } = await supabase
                  .from('users')
                  .delete()
                  .eq('id', userToDelete.id);
                setLoading(false);
                setDeleteDialogOpen(false);
                if (puError || userError) {
                  toast.error('Error deleting user or project assignments');
                } else {
                  setUsers(users.filter(u => u.id !== userToDelete.id));
                  toast.success('User deleted successfully');
                }
              }}
              color="error"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </MainContentWrapper>
    </>
  );
};

export default Permissions;