import React, { useState, useEffect } from 'react';
import { Tab, Nav, Container, Row, Col, Button, Table, Form, Pagination  } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';
import styles from './AdminDashboard.module.css';
import { Typeahead } from 'react-bootstrap-typeahead';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { jwtDecode } from "jwt-decode";
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedUser, setSelectedUser] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [currentRoles, setCurrentRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessTokenSilently} = useAuth0();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  // Pagination for reports 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = await getAccessTokenSilently();
        const decodedToken = jwtDecode(token);
        const userPermissions = decodedToken.permissions || [];
        setIsAdmin(userPermissions.includes("admin:access"));
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [getAccessTokenSilently]);

  const handleUserSelect = async (selected) => {
    setSelectedUser(selected);
    if (selected && selected.length > 0) {
      const selectedUser = selected[0];
      setIsLoading(true);
      try {
        // Trigger the search with the selected user's name
        await searchUsers(selectedUser.name);
        // Fetch the user's roles
        await fetchUserRoles(selectedUser.id);
      } catch (error) {
        console.error('Error handling user selection:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentRoles([]);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { query },
      });
      setUserOptions(
        response.data.map((u) => ({
          id: u.id,
          name: u.name,
        }))
      );
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const fetchUserRoles = async (id) => {
    try {
      //const userId;
      const token = await getAccessTokenSilently();
      // Fetch users roles
      const rolesResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/${id}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (rolesResponse.data && rolesResponse.data.roles) {
        setCurrentRoles(rolesResponse.data.roles);
      } else {
        setCurrentRoles([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAssignRole = async () => {
    if (selectedUser.length > 0 && selectedRole) {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/${selectedUser[0].id}/roles`,
          { role_name: selectedRole },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 200) {
          alert('Role assigned successfully');
        }
        else if (response.status === 403) {
          alert('You are not authorized to assign this role');
        }
        else if (response.status === 409) {
          alert('Role already assigned for user');
        } else {
          alert('Failed to assign role');
        }
        // Clear the selection
        clearAccessFields();
      } catch (error) {
        console.error('Error assigning role:', error);
        alert('An error occurred while assigning the role');
        clearAccessFields();
      }
    } else {
      alert('Please select both a user and a role');
    }
  };

  const clearAccessFields = () => {
    setSelectedUser([]);
    setSelectedRole('');
    setCurrentRoles([]);
  };

  const deleteAssignRole = async () => {
    if (selectedUser.length > 0 && selectedRole) {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.delete(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/${selectedUser[0].id}/roles/${selectedRole}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        // Clear the selection
        setSelectedUser([]);
        if (response.status === 200) {
          alert('Role removed successfully');
        }
        else if (response.status === 403) {
          alert('You are not authorized to remove this role');
        }
        else if (response.status === 404) {
          alert('Role not found for user');
        } else {
          alert('Failed to assign role');
        }
        clearAccessFields();
      } catch (error) {
        console.error('Error assigning role:', error);
        alert('An error occurred while assigning the role');
        clearAccessFields();
      }
    } else {
      alert('Please select both a user and a role');
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, status, type, sortBy, sortOrder]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const fetchReports = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/reports/filtered?page=${currentPage}&limit=10&status=${status}&type=${type}&sortBy=${sortBy}&sortOrder=${sortOrder}`
        , {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      const data = await response.json();
      setReports(data.reports);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const token = await getAccessTokenSilently();
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/reports/${reportId}/action`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh the reports after action
      fetchReports();
    } catch (error) {
      console.error(`Error ${action} report:`, error);
    }
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Sample data for most visited sections (replace with actual data)
  const visitedData = [
    { section: 'Home', visits: 1500 },
    { section: 'Profile', visits: 1200 },
    { section: 'Marketplace', visits: 900 },
    { section: 'Settings', visits: 500 },
    { section: 'Messages', visits: 300 },
    // Add more sections here...
  ];

  // Sample data for user activity per month (replace with actual data)
  const userActivityData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 135 },
    { month: 'Mar', users: 150 },
    { month: 'Apr', users: 160 },
    { month: 'May', users: 170 },
    // Add more months here...
  ];

  // Sample data for post activity per month (replace with actual data)
  const postActivityData = [
    { month: 'Jan', posts: 100 },
    { month: 'Feb', posts: 150 },
    { month: 'Mar', posts: 180 },
    { month: 'Apr', posts: 200 },
    { month: 'May', posts: 220 },
    // Add more months here...
  ];

  return (
    <Container className={styles.adminDashboard}>
      <h1 className={styles.adminTitle}>Admin Dashboard</h1>

      {/* Tab Navigation */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className={`flex-column ${styles.customNav}`}>
              <Nav.Item>
                <Nav.Link eventKey="userAccessControl">User Access</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reports">Reports</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="mostVisited">Most Visited Sections</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="userActivity">User Activity</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="postActivity">Post Activity</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          <Col sm={9}>
            <Tab.Content className="mb-4">
              {/* User Access Control Tab */}
              {isAdmin && (
                <Tab.Pane eventKey="userAccessControl">
                  <h4>User Access Control</h4>
                  <Form>
                    <Form.Group controlId="userSelect">
                      <Form.Label>Select User</Form.Label>
                      <Typeahead
                        id="user-typeahead"
                        labelKey="name"
                        onChange={handleUserSelect}
                        placeholder="Search for a user..."
                        selected={selectedUser}
                        options={userOptions}
                        minLength={2}
                        isLoading={isLoading}
                        onInputChange={(text) => {
                          if (text.length >= 2) {
                            searchUsers(text);
                          }
                        }}
                      />
                    </Form.Group>

                    <Form.Group controlId="userRoles">
                      <Form.Label>Current Users Roles</Form.Label>
                      <Form.Control as="textarea" rows={1} value={currentRoles.join(', ')} readOnly />
                    </Form.Group>

                    <Form.Group controlId="roleSelect">
                      <Form.Label>Select Role to Modify</Form.Label>
                      <Form.Control
                        as="select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="">Choose...</option>
                        <option value="Admin">Admin</option>
                        <option value="Moderator">Moderator</option>
                        <option value="User">User</option>
                      </Form.Control>
                    </Form.Group>

                    <Button variant="primary" onClick={handleAssignRole} className="me-2 mt-2">
                      Assign Role
                    </Button>
                    <Button variant="danger" onClick={deleteAssignRole} className="me-2 mt-2">
                      Remove Role
                    </Button>
                  </Form>
                </Tab.Pane>
              )}

              {/* Reports Tab (Merged View & Handle Reports) */}
              <Tab.Pane eventKey="reports">
                <Container fluid>      
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Control as="select" value={status} onChange={handleStatusChange}>
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="escatalate">Escalate</option>
                          <option value="resolved">Resolved</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Type</Form.Label>
                        <Form.Control as="select" value={type} onChange={handleTypeChange}>
                          <option value="">All Types</option>
                          <option value="post">Post</option>
                          <option value="post-comment">Post-Comment</option>
                          <option value="comment">Comment</option>
                          <option value="user">User</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th onClick={() => handleSortChange('id')}>ID {renderSortIcon('id')}</th>
                        <th onClick={() => handleSortChange('type')}>Type {renderSortIcon('type')}</th>
                        <th onClick={() => handleSortChange('reported_item_id')}>Item Id {renderSortIcon('reported_item_id')}</th>
                        <th onClick={() => handleSortChange('reason')}>Reason {renderSortIcon('reason')}</th>
                        <th onClick={() => handleSortChange('status')}>Status {renderSortIcon('status')}</th>
                        <th onClick={() => handleSortChange('created_at')}>Created At {renderSortIcon('created_at')}</th>
                        <th>Take Action </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.type}</td>
                          <td>{report.reported_item_id}</td>
                          <td>{report.reason}</td>
                          <td>{report.status}</td>
                          <td>{new Date(report.created_at).toLocaleString()}</td>
                          <td>
                                      <Button 
                                        variant="success" 
                                        size="sm" 
                                        onClick={() => handleReportAction(report.id, 'resolve')}
                                        disabled={report.status === 'Resolved'}>
                                        Resolve
                                      </Button>
                                      <Button 
                                        variant="warning" 
                                        size="sm" 
                                        className="ml-2"
                                        onClick={() => handleReportAction(report.id, 'escalate')}
                                        disabled={report.status === 'Escalated'}>
                                        Escalate
                                      </Button>
                                      <Button 
                                        variant="danger" 
                                        size="sm" 
                                        className="ml-2"
                                        onClick={() => handleReportAction(report.id, 'close')}
                                        disabled={report.status === 'Closed'}>
                                        Close
                                      </Button>
                                    </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <Pagination className="justify-content-center">
                    <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Pagination.Item key={page} active={page === currentPage} onClick={() => handlePageChange(page)}>
                        {page}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </Container>
              </Tab.Pane>

              {/* Most Visited Sections Tab (Bar Chart Version) */}
              <Tab.Pane eventKey="mostVisited">
                <h4>Most Visited Sections</h4>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer>
                    <BarChart data={visitedData}>
                      <XAxis dataKey="section" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visits" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Optional: You could display the sections in a table as well */}
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitedData.map((section, index) => (
                      <tr key={index}>
                        <td>{section.section}</td>
                        <td>{section.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              {/* User Activity Tab */}
              <Tab.Pane eventKey="userActivity">
                <h4>User Activity per Month</h4>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer>
                    <LineChart data={userActivityData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Optional: You could display the activity in a table as well */}
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Active Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivityData.map((activity, index) => (
                      <tr key={index}>
                        <td>{activity.month}</td>
                        <td>{activity.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              {/* Post Activity Tab */}
              <Tab.Pane eventKey="postActivity">
                <h4>Post Activity per Month</h4>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer>
                    <LineChart data={postActivityData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="posts" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Optional: You could display the post data in a table as well */}
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Posts Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postActivityData.map((activity, index) => (
                      <tr key={index}>
                        <td>{activity.month}</td>
                        <td>{activity.posts}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default AdminDashboard;
