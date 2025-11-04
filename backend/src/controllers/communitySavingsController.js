const CommunitySavingsPot = require('../models/CommunitySavingsPot');
const User = require('../models/User');

// Create a new community savings pot
exports.createGroup = async (req, res) => {
  try {
    const {
      groupName,
      description,
      monthlyContribution,
      currency,
      startDate,
      totalCycles,
      payoutMethod,
      latePenaltyPercentage,
      gracePeriodDays,
      reminderDaysBefore,
      rules
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, errors: ['User not found'] });
    }

    // Calculate next contribution due date (1 month from start)
    const nextContributionDueDate = new Date(startDate);
    nextContributionDueDate.setMonth(nextContributionDueDate.getMonth() + 1);

    const group = new CommunitySavingsPot({
      groupName,
      description,
      createdBy: req.userId,
      members: [{
        userId: req.userId,
        userName: user.name,
        userEmail: user.email,
        payoutPosition: 1,
        joinedDate: new Date()
      }],
      monthlyContribution,
      currency: currency || user.currency,
      startDate: new Date(startDate),
      totalCycles,
      payoutMethod: payoutMethod || 'rotation',
      latePenaltyPercentage: latePenaltyPercentage || 5,
      gracePeriodDays: gracePeriodDays || 3,
      reminderDaysBefore: reminderDaysBefore || 3,
      nextContributionDueDate,
      rules
    });

    await group.save();

    res.status(201).json({
      success: true,
      group,
      message: 'Community savings group created successfully'
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to create community savings group']
    });
  }
};

// Get all groups for a user (created or member)
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await CommunitySavingsPot.find({
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId }
      ]
    }).populate('createdBy', 'name email')
      .populate('members.userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to fetch groups']
    });
  }
};

// Get single group details
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await CommunitySavingsPot.findById(id)
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email')
      .populate('contributions.userId', 'name email')
      .populate('payouts.userId', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Check if user is member or creator
    const isMember = group.members.some(m => m.userId._id.toString() === req.userId) ||
                     group.createdBy._id.toString() === req.userId;

    if (!isMember) {
      return res.status(403).json({ success: false, errors: ['Access denied'] });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to fetch group details']
    });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    const group = await CommunitySavingsPot.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Only creator can add members
    if (group.createdBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, errors: ['Only group creator can add members'] });
    }

    // Check if group is full
    if (group.members.length >= group.totalCycles) {
      return res.status(400).json({ success: false, errors: ['Group is already full'] });
    }

    // Find user by email
    const newUser = await User.findOne({ email: userEmail });
    if (!newUser) {
      return res.status(404).json({ success: false, errors: ['User not found with this email'] });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      m => m.userId.toString() === newUser._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ success: false, errors: ['User is already a member'] });
    }

    // Add member with next available position
    const nextPosition = group.members.length + 1;
    group.members.push({
      userId: newUser._id,
      userName: newUser.name,
      userEmail: newUser.email,
      payoutPosition: nextPosition,
      joinedDate: new Date()
    });

    // If group is now full and still pending, activate it
    if (group.members.length === group.totalCycles && group.status === 'pending') {
      group.status = 'active';
    }

    await group.save();

    res.json({
      success: true,
      group,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to add member']
    });
  }
};

// Record a contribution
exports.recordContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, contributionDate } = req.body;

    const group = await CommunitySavingsPot.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Check if user is a member
    const member = group.members.find(m => m.userId.toString() === req.userId);
    if (!member) {
      return res.status(403).json({ success: false, errors: ['You are not a member of this group'] });
    }

    // Verify amount matches monthly contribution
    if (amount < group.monthlyContribution) {
      return res.status(400).json({
        success: false,
        errors: ['Contribution amount must match monthly contribution']
      });
    }

    // Calculate penalty if late
    const dueDate = group.nextContributionDueDate;
    const today = new Date();
    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const penaltyAmount = daysLate > group.gracePeriodDays
      ? group.calculatePenalty(daysLate)
      : 0;

    // Determine status
    let status = 'completed';
    if (daysLate > group.gracePeriodDays) {
      status = 'late';
    }

    // Add contribution
    group.contributions.push({
      userId: req.userId,
      amount,
      contributionDate: contributionDate || new Date(),
      status,
      penaltyAmount,
      dueDate
    });

    // Update member stats
    member.totalContributions += amount;
    if (penaltyAmount > 0) {
      member.totalPenalties += penaltyAmount;
      member.missedPayments += 1;
    }

    // Update total pot amount
    group.totalPotAmount += amount + penaltyAmount;

    await group.save();

    res.json({
      success: true,
      contribution: group.contributions[group.contributions.length - 1],
      penaltyAmount,
      message: penaltyAmount > 0
        ? `Contribution recorded with penalty of ${penaltyAmount}`
        : 'Contribution recorded successfully'
    });
  } catch (error) {
    console.error('Error recording contribution:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to record contribution']
    });
  }
};

// Process payout for current cycle
exports.processPayout = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await CommunitySavingsPot.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Only creator can process payouts
    if (group.createdBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, errors: ['Only group creator can process payouts'] });
    }

    if (group.status !== 'active') {
      return res.status(400).json({ success: false, errors: ['Group must be active to process payouts'] });
    }

    // Get next recipient
    const recipient = group.getNextPayoutRecipient();
    if (!recipient) {
      return res.status(400).json({ success: false, errors: ['No eligible recipient found'] });
    }

    // Calculate current pot amount
    const potAmount = group.calculateCurrentPot();

    if (potAmount < group.monthlyContribution * group.members.length) {
      return res.status(400).json({
        success: false,
        errors: ['Insufficient contributions for payout']
      });
    }

    // Record payout
    group.payouts.push({
      userId: recipient.userId,
      amount: potAmount,
      payoutDate: new Date(),
      status: 'completed',
      monthCycle: group.currentCycle
    });

    // Update member status
    recipient.hasReceivedPayout = true;

    // Move to next cycle
    group.currentCycle += 1;
    group.totalPotAmount = 0;

    // Calculate next contribution due date
    const nextDueDate = new Date(group.nextContributionDueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    group.nextContributionDueDate = nextDueDate;

    // Check if all members have received payout
    const allReceived = group.members.every(m => m.hasReceivedPayout);
    if (allReceived) {
      group.status = 'completed';
    }

    await group.save();

    res.json({
      success: true,
      payout: group.payouts[group.payouts.length - 1],
      message: `Payout of ${potAmount} processed to ${recipient.userName}`
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to process payout']
    });
  }
};

// Get pending contributions for user
exports.getPendingContributions = async (req, res) => {
  try {
    const groups = await CommunitySavingsPot.find({
      'members.userId': req.userId,
      status: 'active'
    });

    const pending = groups.filter(group => {
      const userContributions = group.contributions.filter(
        c => c.userId.toString() === req.userId &&
        c.dueDate.getMonth() === new Date().getMonth() &&
        c.dueDate.getFullYear() === new Date().getFullYear()
      );

      return userContributions.length === 0 || userContributions.some(c => c.status === 'pending');
    });

    res.json({ success: true, pendingGroups: pending });
  } catch (error) {
    console.error('Error fetching pending contributions:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to fetch pending contributions']
    });
  }
};

// Get group ledger
exports.getGroupLedger = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await CommunitySavingsPot.findById(id)
      .populate('contributions.userId', 'name email')
      .populate('payouts.userId', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Check if user is member
    const isMember = group.members.some(m => m.userId.toString() === req.userId) ||
                     group.createdBy.toString() === req.userId;

    if (!isMember) {
      return res.status(403).json({ success: false, errors: ['Access denied'] });
    }

    const ledger = {
      contributions: group.contributions.sort((a, b) => b.contributionDate - a.contributionDate),
      payouts: group.payouts.sort((a, b) => b.payoutDate - a.payoutDate),
      totalCollected: group.contributions.reduce((sum, c) => sum + c.amount + (c.penaltyAmount || 0), 0),
      totalPaidOut: group.payouts.reduce((sum, p) => sum + p.amount, 0),
      currentBalance: group.totalPotAmount
    };

    res.json({ success: true, ledger });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to fetch group ledger']
    });
  }
};

// Update group settings
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const group = await CommunitySavingsPot.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Only creator can update
    if (group.createdBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, errors: ['Only group creator can update settings'] });
    }

    // Prevent updating critical fields if group is active
    if (group.status === 'active') {
      const restrictedFields = ['monthlyContribution', 'totalCycles', 'startDate'];
      const hasRestrictedUpdate = restrictedFields.some(field => updates[field] !== undefined);

      if (hasRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          errors: ['Cannot update critical fields for active groups']
        });
      }
    }

    // Allow updating specific fields
    const allowedUpdates = ['description', 'rules', 'latePenaltyPercentage', 'gracePeriodDays', 'reminderDaysBefore'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        group[field] = updates[field];
      }
    });

    await group.save();

    res.json({
      success: true,
      group,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to update group']
    });
  }
};

// Delete/Cancel group
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await CommunitySavingsPot.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, errors: ['Group not found'] });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== req.userId) {
      return res.status(403).json({ success: false, errors: ['Only group creator can delete group'] });
    }

    // Can only delete if pending or no contributions made
    if (group.status === 'active' && group.contributions.length > 0) {
      group.status = 'cancelled';
      await group.save();
      return res.json({
        success: true,
        message: 'Group cancelled. Please settle all contributions before deletion.'
      });
    }

    await CommunitySavingsPot.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      errors: ['Failed to delete group']
    });
  }
};

module.exports = exports;
