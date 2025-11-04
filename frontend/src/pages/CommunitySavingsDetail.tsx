import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communitySavingsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import { getUserId } from '../utils/helpers';
import '../styles/CommunitySavings.css';

const CommunitySavingsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');

  useEffect(() => {
    if (id) {
      fetchGroupDetails();
      fetchLedger();
    }
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await communitySavingsAPI.getById(id!);
      setGroup(response.data.group);
    } catch (err: any) {
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      const response = await communitySavingsAPI.getLedger(id!);
      setLedger(response.data.ledger);
    } catch (err) {
      console.error('Failed to load ledger');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await communitySavingsAPI.addMember(id!, memberEmail);
      setSuccess('Member added successfully!');
      setMemberEmail('');
      setShowAddMember(false);
      fetchGroupDetails();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to add member');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const amount = parseFloat(contributionAmount);
      const response = await communitySavingsAPI.contribute(id!, amount);
      setSuccess(response.data.message || 'Contribution recorded successfully!');
      setContributionAmount('');
      setShowContribute(false);
      fetchGroupDetails();
      fetchLedger();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to record contribution');
    }
  };

  const handleProcessPayout = async () => {
    if (!window.confirm('Are you sure you want to process the payout for this cycle?')) return;
    try {
      setError('');
      const response = await communitySavingsAPI.processPayout(id!);
      setSuccess(response.data.message || 'Payout processed successfully!');
      fetchGroupDetails();
      fetchLedger();
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to process payout');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    try {
      await communitySavingsAPI.delete(id!);
      navigate('/community-savings');
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary"></div>
          <p className="mt-3">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Group not found</div>
      </div>
    );
  }

  const isCreator = group.createdBy._id === getUserId(user);
  const nextRecipient = group.members.find((m: any) => !m.hasReceivedPayout);

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-primary mb-3" onClick={() => navigate('/community-savings')}>
        <i className="bi bi-arrow-left"></i> Back to Groups
      </button>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="detail-header">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1>{group.groupName}</h1>
            <p>{group.description}</p>
          </div>
          <span className={`badge ${group.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            {group.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="detail-stats">
        <div className="detail-stat-card">
          <i className="bi bi-cash-stack"></i>
          <small>Monthly Contribution</small>
          <h3>{group.currency} {group.monthlyContribution}</h3>
        </div>
        <div className="detail-stat-card">
          <i className="bi bi-wallet2"></i>
          <small>Current Pot</small>
          <h3>{group.currency} {group.totalPotAmount}</h3>
        </div>
        <div className="detail-stat-card">
          <i className="bi bi-arrow-repeat"></i>
          <small>Current Cycle</small>
          <h3>{group.currentCycle} / {group.totalCycles}</h3>
        </div>
        <div className="detail-stat-card">
          <i className="bi bi-people"></i>
          <small>Members</small>
          <h3>{group.members.length} / {group.totalCycles}</h3>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3><i className="bi bi-people"></i> Members</h3>
              {isCreator && group.members.length < group.totalCycles && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowAddMember(!showAddMember)}>
                  <i className="bi bi-plus"></i> Add Member
                </button>
              )}
            </div>

            {showAddMember && (
              <form onSubmit={handleAddMember} className="p-3 bg-light">
                <div className="form-group">
                  <label>Member Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    placeholder="Enter registered user email"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">Add</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="members-list p-3">
              {group.members.map((member: any, index: number) => (
                <div key={member._id} className="member-card">
                  <div className="member-info">
                    <div className="member-avatar">{member.userName[0].toUpperCase()}</div>
                    <div className="member-details">
                      <h4>
                        {member.userName}
                        {member.hasReceivedPayout && <i className="bi bi-check-circle-fill text-success ms-2"></i>}
                      </h4>
                      <p>{member.userEmail}</p>
                      <small>Position: {member.payoutPosition}</small>
                    </div>
                  </div>
                  <div className="member-stats">
                    <small>Contributed</small>
                    <strong>{group.currency} {member.totalContributions}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h3><i className="bi bi-gear"></i> Actions</h3>
            </div>
            <div className="p-3">
              {group.status === 'active' && (
                <>
                  <button className="btn btn-primary w-100 mb-2" onClick={() => setShowContribute(!showContribute)}>
                    <i className="bi bi-cash-coin"></i> Make Contribution
                  </button>

                  {showContribute && (
                    <form onSubmit={handleContribute} className="mb-3 p-3 bg-light rounded">
                      <div className="form-group">
                        <label>Amount ({group.currency})</label>
                        <input
                          type="number"
                          className="form-control"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          required
                          step="0.01"
                          min={group.monthlyContribution}
                        />
                        <small className="text-muted">Required: {group.currency} {group.monthlyContribution}</small>
                      </div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary">Submit</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowContribute(false)}>Cancel</button>
                      </div>
                    </form>
                  )}

                  {isCreator && nextRecipient && (
                    <>
                      <div className="alert alert-info">
                        <strong>Next Payout:</strong> {nextRecipient.userName}
                      </div>
                      <button className="btn btn-success w-100 mb-2" onClick={handleProcessPayout}>
                        <i className="bi bi-send"></i> Process Payout
                      </button>
                    </>
                  )}
                </>
              )}

              {isCreator && (
                <button className="btn btn-danger w-100 mt-2" onClick={handleDeleteGroup}>
                  <i className="bi bi-trash"></i> Delete Group
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {ledger && (
        <div className="card">
          <div className="card-header">
            <h3><i className="bi bi-journal-text"></i> Transaction Ledger</h3>
          </div>
          <div className="table-responsive">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.contributions?.map((contrib: any, idx: number) => (
                  <tr key={`contrib-${idx}`}>
                    <td><span className="badge badge-primary">Contribution</span></td>
                    <td>{contrib.userId?.name || 'Unknown'}</td>
                    <td>{group.currency} {contrib.amount + (contrib.penaltyAmount || 0)}</td>
                    <td>{new Date(contrib.contributionDate).toLocaleDateString()}</td>
                    <td><span className={`badge ${contrib.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{contrib.status}</span></td>
                  </tr>
                ))}
                {ledger.payouts?.map((payout: any, idx: number) => (
                  <tr key={`payout-${idx}`}>
                    <td><span className="badge badge-success">Payout</span></td>
                    <td>{payout.userId?.name || 'Unknown'}</td>
                    <td>{group.currency} {payout.amount}</td>
                    <td>{new Date(payout.payoutDate).toLocaleDateString()}</td>
                    <td><span className="badge badge-success">{payout.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySavingsDetail;
