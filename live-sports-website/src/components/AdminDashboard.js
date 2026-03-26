import React, { useState, useEffect } from 'react';
import { fetchUsers, deleteUser, banUser, unbanUser, getAdminStats, getAdminLogs } from '../services/api';
import '../styles/UserProfile.css'; // Reusing some profile styles
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ user, onBack }) => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, statsData, logsData] = await Promise.all([
                fetchUsers(),
                getAdminStats(),
                getAdminLogs()
            ]);
            setUsers(usersData);
            setStats(statsData);
            setLogs(logsData);
        } catch (err) {
            setError(err.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            alert(err.message || 'Failed to delete user');
        }
    };

    const handleBanToggle = async (id, isBanned) => {
        if (!window.confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} this user?`)) return;
        try {
            if (isBanned) {
                await unbanUser(id);
            } else {
                await banUser(id);
            }
            setUsers(users.map(u => u.id === id ? { ...u, isBanned: !isBanned } : u));
        } catch (err) {
            alert(err.message || 'Failed to update ban status');
        }
    };

    const isOnline = (lastActiveAt) => {
        if (!lastActiveAt) return false;
        // Consider online if active in the last 5 minutes (300000 ms)
        return (new Date() - new Date(lastActiveAt)) < 300000;
    };

    if (user?.role !== 'admin') {
        return <div className="profile-container"><h2>Access Denied</h2></div>;
    }

    return (
        <div className="profile-container admin-dashboard">
            <div className="profile-header">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Matches
                </button>
                <h2>Admin Panel</h2>
            </div>
            
            <div className="profile-content">
                <div className="profile-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h3>User Management</h3>
                    {error && <div className="error-message">⚠️ {error}</div>}
                    
                    {loading ? (
                        <p>Loading analytics and users...</p>
                    ) : (
                        <>
                            {stats && (
                                <div className="admin-stats" style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                                    <div className="stat-box" style={{ flex: 1, minWidth: '200px', background: 'rgba(45, 110, 64, 0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(45, 110, 64, 0.2)' }}>
                                        <h4 style={{ margin: 0, color: '#aaa' }}>Total Users</h4>
                                        <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0 0', color: '#2d6e40' }}>{stats.totalUsers}</p>
                                    </div>
                                    <div className="stat-box" style={{ flex: 1, minWidth: '200px', background: 'rgba(33, 150, 243, 0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                                        <h4 style={{ margin: 0, color: '#aaa' }}>Total Bets</h4>
                                        <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0 0', color: '#4facfe' }}>{stats.totalBets}</p>
                                    </div>
                                    <div className="stat-box" style={{ flex: 1, minWidth: '200px', background: 'rgba(255, 193, 7, 0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                                        <h4 style={{ margin: 0, color: '#aaa' }}>Bet Volume</h4>
                                        <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0 0', color: '#ffb347' }}>{stats.totalBetAmount} 💰</p>
                                    </div>
                                </div>
                            )}

                            <h3>User Management</h3>
                            <div className="table-responsive" style={{ marginBottom: '30px' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined Date</th>
                                        <th>Last Active</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ opacity: u.isBanned ? 0.6 : 1 }}>
                                            <td className="status-cell">
                                                {u.isBanned ? (
                                                    <span className="banned-dot" title="Banned">🔴</span>
                                                ) : isOnline(u.lastActiveAt) ? (
                                                    <span className="online-dot" title="Online">🟢</span>
                                                ) : (
                                                    <span className="offline-dot" title="Offline">⚪</span>
                                                )}
                                            </td>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-badge ${u.role}`}>{u.role}</span>
                                            </td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'Never'}
                                            </td>
                                            <td style={{ display: 'flex', gap: '8px' }}>
                                                {u.role !== 'admin' && (
                                                    <>
                                                        <button 
                                                            className="ban-btn"
                                                            style={{ background: u.isBanned ? '#4facfe' : '#ff9800', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => handleBanToggle(u.id, u.isBanned)}
                                                        >
                                                            {u.isBanned ? 'Unban' : 'Ban'}
                                                        </button>
                                                        <button 
                                                            className="delete-btn"
                                                            onClick={() => handleDelete(u.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                            <h3>Recent Activity</h3>
                            <div className="activity-logs" style={{ background: '#1a1a1a', borderRadius: '8px', padding: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                                {logs.length === 0 ? (
                                    <p style={{ color: '#888' }}>No recent activity.</p>
                                ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {logs.map(log => (
                                            <li key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid #333' }}>
                                                <span style={{ color: '#888', fontSize: '0.85em', marginRight: '10px' }}>
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </span>
                                                <strong style={{ color: '#4facfe' }}>User {log.UserId}:</strong>{' '}
                                                <span style={{ color: '#ccc' }}>{log.action}</span>
                                                {log.details && (
                                                    <span style={{ color: '#888', marginLeft: '5px', fontSize: '0.9em' }}>
                                                        ({JSON.stringify(log.details)})
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
