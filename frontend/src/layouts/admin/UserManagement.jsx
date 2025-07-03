import React, { useState } from 'react';
import '../../styles/layouts/admin/AdminDashboard.css';
import AddUser from './AddUser'; // Import your AddUser component
import ManageUsers from './ManageUsers'; // Import your ManageUsers component

const UserManagement = () => {
    const [activeView, setActiveView] = useState('manage'); // Default: 'manage'

    return (
        <div>
            <div className="dashboard-container">
                <h1 className="mb-4 text-center">User Management</h1>

                {/* Navigation Buttons */}
                <div className="mt-4">
                    <div className="d-flex justify-content-center gap-3"> {/* Added gap for spacing */}
                        <div className="text-center">
                            <button
                                onClick={() => setActiveView('manage')}
                                className={`btn ${activeView === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                <i className="fas fa-users-cog me-2"></i>Manage Users
                            </button>
                        </div>
                        <div className="text-center">
                            <button
                                onClick={() => setActiveView('add')}
                                className={`btn ${activeView === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                <i className="fas fa-plus me-2"></i>Add a New User
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conditionally Render Component */}
                {activeView === 'add' ? <AddUser /> : <ManageUsers />}
            </div>
        </div>
    );
};

export default UserManagement;
