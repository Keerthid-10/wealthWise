const CommunitySavingsPot = require('../models/CommunitySavingsPot');
const User = require('../models/User');

/**
 * Create a new community savings pot
 */
const createPot = async (userId, potData) => {
  try {
    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Calculate total cycles based on number of initial members + creator
    const totalCycles = potData.totalCycles || 1;

    // Create the pot
    const pot = await CommunitySavingsPot.create({
      groupName: potData.groupName,
      description: potData.description,
      createdBy: userId,
      members: [{
        userId,
        userName: user.name,
        userEmail: user.email,
        joinedDate: new Date(),
        payoutPosition: 1,
        hasReceivedPayout: false
      }],
      monthlyContribution: potData.monthlyContribution,
      currency: potData.currency || 'INR',
      startDate: potData.startDate || new Date(),
      totalCycles,
      payoutMethod: potData.payoutMethod || 'rotation',
      status: 'pending',
      latePenaltyPercentage: potData.latePenaltyPercentage || 5,
      gracePeriodDays: potData.gracePeriodDays || 3,
      reminderDaysBefore: potData.reminderDaysBefore || 3,
      rules: potData.rules || ''
    });

    // Calculate next contribution due date and next payout date
    const startDate = new Date(pot.startDate);
    pot.nextContributionDueDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
    pot.nextPayoutDate = new Date(pot.nextContributionDueDate);
    await pot.save();

    return { success: true, pot };
  } catch (error) {
    console.error('Error creating pot:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add member to pot by email
 */
const addMember = async (potId, memberEmail, addedByUserId) => {
  try {
    const pot = await CommunitySavingsPot.findById(potId);
    if (!pot) {
      return { success: false, error: 'Pot not found' };
    }

    // Check if user adding member is the creator
    if (pot.createdBy.toString() !== addedByUserId.toString()) {
      return { success: false, error: 'Only the creator can add members' };
    }

    // Check if pot is full
    if (pot.members.length >= pot.totalCycles) {
      return { success: false, error: 'Pot is full' };
    }

    // Find user by email
    const user = await User.findOne({ email: memberEmail });
    if (!user) {
      return { success: false, error: 'User not found with this email' };
    }

    // Check if user is already a member
    const alreadyMember = pot.members.some(m => m.userId.toString() === user._id.toString());
    if (alreadyMember) {
      return { success: false, error: 'User is already a member' };
    }

    // Add member
    const payoutPosition = pot.members.length + 1;
    pot.members.push({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      joinedDate: new Date(),
      payoutPosition,
      hasReceivedPayout: false
    });

    // If pot is now full, activate it
    if (pot.members.length === pot.totalCycles && pot.status === 'pending') {
      pot.status = 'active';
    }

    await pot.save();

    return { success: true, pot, newMember: user.name };
  } catch (error) {
    console.error('Error adding member:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Make a contribution
 */
const makeContribution = async (potId, userId, amount) => {
  try {
    const pot = await CommunitySavingsPot.findById(potId);
    if (!pot) {
      return { success: false, error: 'Pot not found' };
    }

    // Check if user is a member
    const member = pot.members.find(m => m.userId.toString() === userId.toString());
    if (!member) {
      return { success: false, error: 'You are not a member of this pot' };
    }

    // Check if amount matches monthly contribution
    if (amount !== pot.monthlyContribution) {
      return { success: false, error: `Contribution must be ${pot.currency} ${pot.monthlyContribution}` };
    }

    // Calculate days late
    const dueDate = pot.nextContributionDueDate;
    const today = new Date();
    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const penalty = daysLate > pot.gracePeriodDays ? pot.calculatePenalty(daysLate) : 0;

    // Add contribution
    pot.contributions.push({
      userId,
      amount,
      contributionDate: today,
      status: 'completed',
      penaltyAmount: penalty,
      dueDate
    });

    // Update member stats
    member.totalContributions += amount;
    if (penalty > 0) {
      member.totalPenalties += penalty;
    }

    // Update total pot amount
    pot.totalPotAmount += amount + penalty;

    await pot.save();

    return {
      success: true,
      pot,
      contribution: {
        amount,
        penalty,
        daysLate: daysLate > 0 ? daysLate : 0,
        totalPaid: amount + penalty
      }
    };
  } catch (error) {
    console.error('Error making contribution:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process payout for current cycle
 */
const processPayout = async (potId, adminUserId) => {
  try {
    const pot = await CommunitySavingsPot.findById(potId);
    if (!pot) {
      return { success: false, error: 'Pot not found' };
    }

    // Check if user is creator
    if (pot.createdBy.toString() !== adminUserId.toString()) {
      return { success: false, error: 'Only the creator can process payouts' };
    }

    // Get next payout recipient
    const recipient = pot.getNextPayoutRecipient();
    if (!recipient) {
      return { success: false, error: 'No recipient found for payout' };
    }

    // Calculate payout amount
    const payoutAmount = pot.totalPotAmount;

    // Create payout record
    pot.payouts.push({
      userId: recipient.userId,
      amount: payoutAmount,
      payoutDate: new Date(),
      status: 'completed',
      monthCycle: pot.currentCycle
    });

    // Mark recipient as having received payout
    recipient.hasReceivedPayout = true;

    // Reset pot amount for next cycle
    pot.totalPotAmount = 0;

    // Increment cycle
    pot.currentCycle += 1;

    // Check if all cycles are complete
    if (pot.currentCycle > pot.totalCycles) {
      pot.status = 'completed';
    } else {
      // Calculate next contribution due date
      const nextDate = new Date(pot.nextContributionDueDate);
      pot.nextContributionDueDate = new Date(nextDate.setMonth(nextDate.getMonth() + 1));
      pot.nextPayoutDate = new Date(pot.nextContributionDueDate);
    }

    await pot.save();

    return {
      success: true,
      pot,
      payout: {
        recipient: recipient.userName,
        amount: payoutAmount,
        cycle: pot.currentCycle - 1
      }
    };
  } catch (error) {
    console.error('Error processing payout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all pots for a user (created or member)
 */
const getUserPots = async (userId) => {
  try {
    const pots = await CommunitySavingsPot.find({
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    }).sort({ createdAt: -1 });

    return { success: true, pots };
  } catch (error) {
    console.error('Error getting user pots:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pot details
 */
const getPotDetails = async (potId, userId) => {
  try {
    const pot = await CommunitySavingsPot.findById(potId)
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email');

    if (!pot) {
      return { success: false, error: 'Pot not found' };
    }

    // Check if user is a member or creator
    const isMember = pot.members.some(m => m.userId._id.toString() === userId.toString());
    const isCreator = pot.createdBy._id.toString() === userId.toString();

    if (!isMember && !isCreator) {
      return { success: false, error: 'You do not have access to this pot' };
    }

    // Calculate current user's contribution status
    const userMember = pot.members.find(m => m.userId._id.toString() === userId.toString());
    const userContributions = pot.contributions.filter(c => c.userId.toString() === userId.toString());

    return {
      success: true,
      pot,
      userStats: {
        totalContributed: userMember?.totalContributions || 0,
        totalPenalties: userMember?.totalPenalties || 0,
        missedPayments: userMember?.missedPayments || 0,
        hasReceivedPayout: userMember?.hasReceivedPayout || false,
        payoutPosition: userMember?.payoutPosition || 0,
        contributionHistory: userContributions
      }
    };
  } catch (error) {
    console.error('Error getting pot details:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get reminders for user
 */
const getReminders = async (userId) => {
  try {
    const pots = await CommunitySavingsPot.find({
      'members.userId': userId,
      status: 'active'
    });

    const reminders = [];
    const today = new Date();

    for (const pot of pots) {
      // Check if contribution is due soon
      const dueDate = new Date(pot.nextContributionDueDate);
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= pot.reminderDaysBefore && daysUntilDue >= 0) {
        reminders.push({
          type: 'contribution_due',
          potId: pot._id,
          potName: pot.groupName,
          amount: pot.monthlyContribution,
          currency: pot.currency,
          dueDate: pot.nextContributionDueDate,
          daysRemaining: daysUntilDue,
          message: `Contribution of ${pot.currency} ${pot.monthlyContribution} due in ${daysUntilDue} days for "${pot.groupName}"`
        });
      }

      // Check if contribution is overdue
      if (daysUntilDue < 0) {
        const daysOverdue = Math.abs(daysUntilDue);
        const penalty = daysOverdue > pot.gracePeriodDays ? pot.calculatePenalty(daysOverdue) : 0;

        reminders.push({
          type: 'contribution_overdue',
          potId: pot._id,
          potName: pot.groupName,
          amount: pot.monthlyContribution,
          currency: pot.currency,
          daysOverdue,
          penalty,
          message: `OVERDUE: Contribution of ${pot.currency} ${pot.monthlyContribution} was due ${daysOverdue} days ago${penalty > 0 ? ` (Penalty: ${pot.currency} ${penalty})` : ''}`
        });
      }
    }

    return { success: true, reminders };
  } catch (error) {
    console.error('Error getting reminders:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete/Cancel pot
 */
const deletePot = async (potId, userId) => {
  try {
    const pot = await CommunitySavingsPot.findById(potId);
    if (!pot) {
      return { success: false, error: 'Pot not found' };
    }

    // Only creator can delete
    if (pot.createdBy.toString() !== userId.toString()) {
      return { success: false, error: 'Only the creator can delete this pot' };
    }

    // Can only delete if status is pending or if no contributions made
    if (pot.status === 'active' && pot.contributions.length > 0) {
      return { success: false, error: 'Cannot delete an active pot with contributions. Consider cancelling it instead.' };
    }

    await CommunitySavingsPot.findByIdAndDelete(potId);

    return { success: true, message: 'Pot deleted successfully' };
  } catch (error) {
    console.error('Error deleting pot:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createPot,
  addMember,
  makeContribution,
  processPayout,
  getUserPots,
  getPotDetails,
  getReminders,
  deletePot
};
