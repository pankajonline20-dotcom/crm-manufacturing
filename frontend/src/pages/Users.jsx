import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Lock } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'agent' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields required');
      return;
    }

    try {
      await api.post('/auth/users', formData);
      toast.success('✓ User created!');
      setFormData({ name: '', email: '', password: '', role: 'agent' });
      setShowForm(false);
      loadUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create user';
      console.error('Create user error:', err);
      toast.error(errorMsg);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success('✓ User deleted');
      loadUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      toast.success(`✓ Role changed to ${newRole}`);
      loadUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>👥 Team Members</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#E8500A',
            color: 'white',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Plus size={16} /> Add Team Member
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Add New Team Member</h3>
          <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Rahul Kumar"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@clerbulk.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              >
                <option value="agent">Agent (Sales Team)</option>
                <option value="admin">Admin (Manager)</option>
              </select>
            </div>
          </form>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddUser}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#10B981',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              ✓ Create Member
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                  {user.name}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                  {user.email}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                      background: user.role === 'admin' ? '#fef3c7' : '#dbeafe',
                      color: user.role === 'admin' ? '#92400e' : '#1e40af',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          No team members yet. Add your first member!
        </div>
      )}
    </div>
  );
}
