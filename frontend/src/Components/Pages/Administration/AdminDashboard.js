import React, { useState, useEffect  } from 'react';
import { Tab, Nav, Container, Row, Col, Button, Table, Form } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';
import styles from './AdminDashboard.module.css';
import { Typeahead } from 'react-bootstrap-typeahead';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch users from your API
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Replace this with your actual API call
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAssignRole = async () => {
    if (selectedUser.length > 0 && selectedRole) {
      // Replace this with your actual API call to assign role
      try {
        const response = await fetch('/api/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedUser[0].id, role: selectedRole }),
        });
        if (response.ok) {
          alert('Role assigned successfully');
          //Todo, refresh the user list with the new role
        } else {
          alert('Failed to assign role');
        }
      } catch (error) {
        console.error('Error assigning role:', error);
        alert('An error occurred while assigning the role');
      }
    } else {
      alert('Please select both a user and a role');
    }
  };

  const deleteAssignRole = async () => {
    if (selectedUser.length > 0 && selectedRole) {
      // Replace this with your actual API call to assign role
      try {
        const response = await fetch('/api/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedUser[0].id, role: selectedRole }),
        });
        if (response.ok) {
          alert('Role assigned successfully');
          //Todo, refresh the user list with the new role
        } else {
          alert('Failed to assign role');
        }
      } catch (error) {
        console.error('Error assigning role:', error);
        alert('An error occurred while assigning the role');
      }
    } else {
      alert('Please select both a user and a role');
    }
  };


  // Sample data for reports (replace with actual data)
  const reports = [
    { id: 1, title: 'Inappropriate Content', description: 'User posted offensive content', status: 'Pending', assignedTo: 'Moderator A' },
    { id: 2, title: 'Spam', description: 'User posting promotional links', status: 'Resolved', assignedTo: 'Moderator B' },
    { id: 3, title: 'Harassment', description: 'User reported for harassment', status: 'Pending', assignedTo: 'Moderator C' },
    // Add more reports here...
  ];

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

  // Handle report actions
  const handleReportAction = (reportId, action) => {
    console.log(`Report ${reportId} ${action}`);
    // Update the report status based on action (resolve, escalate, close, etc.)
    // This can involve sending a request to your backend to update the report status
  };

  return (
    <Container className={styles.adminDashboard}>
      <h1 className={styles.adminTitle}>Admin Dashboard</h1>

      {/* Tab Navigation */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
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
              <Tab.Pane eventKey="userAccessControl">
                <h4>User Access Control</h4>
                <Form>
                  <Form.Group controlId="userSelect">
                    <Form.Label>Select User</Form.Label>
                    <Typeahead
                      id="user-typeahead"
                      labelKey="name"
                      onChange={setSelectedUser}
                      options={users}
                      placeholder="Search for a user..."
                      selected={selectedUser}
                      isLoading={isLoading}
                    />
                  </Form.Group>

                  <Form.Group controlId="userRoles">
                    <Form.Label>Current Users Roles</Form.Label>
                    <Form.Control as="textarea" rows={1} value={selectedUser.roles} readOnly />
                  </Form.Group>

                  <Form.Group controlId="roleSelect">
                    <Form.Label>Select Role to Modify</Form.Label>
                    <Form.Control 
                      as="select" 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Choose...</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="user">User</option>
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

              {/* Reports Tab (Merged View & Handle Reports) */}
              <Tab.Pane eventKey="reports">
                <h4>User Reports</h4>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>{report.title}</td>
                        <td>{report.status}</td>
                        <td>{report.assignedTo}</td>
                        <td>
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleReportAction(report.id, 'Resolve')}
                            disabled={report.status === 'Resolved'}>
                            Resolve
                          </Button>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="ml-2"
                            onClick={() => handleReportAction(report.id, 'Escalate')}
                            disabled={report.status === 'Escalated'}>
                            Escalate
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            className="ml-2"
                            onClick={() => handleReportAction(report.id, 'Close')}
                            disabled={report.status === 'Closed'}>
                            Close
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
