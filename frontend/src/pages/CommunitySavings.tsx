import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communitySavingsAPI } from '../services/api';
import '../styles/CommunitySavings.css';

interface Group {
  _id: string;
  groupName: string;
  description: string;
  monthlyContribution: number;
  currency: string;
  status: string;
  members: any[];
  totalCycles: number;
  currentCycle: number;
  createdBy: any;
  nextContributionDueDate: string;
  totalPotAmount: number;
}

const CommunitySavings: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await communitySavingsAPI.getAll();
      setGroups(response.data.groups || []);
    } catch (err: any) {
      setError('Failed to load community savings groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { class: 'badge-warning', text: 'Pending' },
      active: { class: 'badge-success', text: 'Active' },
      completed: { class: 'badge-primary', text: 'Completed' },
      cancelled: { class: 'badge-danger', text: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || { class: 'badge-secondary', text: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading community savings groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h2><i className="bi bi-people"></i> Community Savings Pots</h2>
            <p>Save together, achieve together</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/community-savings/create')}>
            <i className="bi bi-plus-circle"></i> Create New Group
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {groups.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <h3>No Community Savings Groups</h3>
            <p>Create or join a community savings group to start saving together</p>
            <button className="btn btn-primary" onClick={() => navigate('/community-savings/create')}>
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map((group) => (
              <div key={group._id} className="group-card" onClick={() => navigate(`/community-savings/${group._id}`)}>
                <div className="group-card-header">
                  <h3>{group.groupName}</h3>
                  {getStatusBadge(group.status)}
                </div>
                <p className="group-description">{group.description}</p>
                <div className="group-stats">
                  <div className="stat">
                    <i className="bi bi-cash"></i>
                    <div>
                      <small>Monthly Contribution</small>
                      <strong>{group.currency} {group.monthlyContribution}</strong>
                    </div>
                  </div>
                  <div className="stat">
                    <i className="bi bi-people"></i>
                    <div>
                      <small>Members</small>
                      <strong>{group.members.length} / {group.totalCycles}</strong>
                    </div>
                  </div>
                  <div className="stat">
                    <i className="bi bi-arrow-repeat"></i>
                    <div>
                      <small>Cycle</small>
                      <strong>{group.currentCycle} / {group.totalCycles}</strong>
                    </div>
                  </div>
                  <div className="stat">
                    <i className="bi bi-wallet2"></i>
                    <div>
                      <small>Current Pot</small>
                      <strong>{group.currency} {group.totalPotAmount}</strong>
                    </div>
                  </div>
                </div>
                {group.status === 'active' && (
                  <div className="group-footer">
                    <small>
                      <i className="bi bi-calendar-event"></i> Next Due: {new Date(group.nextContributionDueDate).toLocaleDateString()}
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunitySavings;
