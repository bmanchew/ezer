const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');

// @route   GET api/teams
// @desc    Get all teams for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Find teams where user is owner or member
    const teams = await Team.findAll({
      where: {
        owner_id: req.user.id
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: TeamMember,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    // Also find teams where user is a member
    const memberTeams = await Team.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: TeamMember,
          where: {
            user_id: req.user.id
          },
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    // Combine and remove duplicates
    const allTeams = [...teams, ...memberTeams.filter(team => 
      !teams.some(t => t.id === team.id)
    )];

    res.json(allTeams);
  } catch (err) {
    console.error('Error in get teams:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: TeamMember,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if user is owner or member
    const isOwner = team.owner_id === req.user.id;
    const isMember = team.team_members.some(member => member.user_id === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Not authorized to access this team' });
    }

    res.json(team);
  } catch (err) {
    console.error('Error in get team:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/teams
// @desc    Create a team
// @access  Private
router.post('/', [
  auth,
  check('name', 'Name is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    const team = await Team.create({
      name,
      description,
      owner_id: req.user.id
    });

    // Get the created team with owner info
    const newTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(newTeam);
  } catch (err) {
    console.error('Error in create team:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/teams/:id
// @desc    Update a team
// @access  Private
router.put('/:id', [
  auth,
  check('name', 'Name is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;

  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if user is the team owner
    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this team' });
    }

    // Update team
    team.name = name;
    team.description = description;
    await team.save();

    // Get the updated team with owner info
    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: TeamMember,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.json(updatedTeam);
  } catch (err) {
    console.error('Error in update team:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/teams/:id
// @desc    Delete a team
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if user is the team owner
    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this team' });
    }

    // Delete team members first (cascade delete should handle this, but just to be safe)
    await TeamMember.destroy({
      where: {
        team_id: req.params.id
      }
    });

    // Delete team
    await team.destroy();

    res.json({ msg: 'Team deleted' });
  } catch (err) {
    console.error('Error in delete team:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/teams/:id/members
// @desc    Add a member to a team
// @access  Private
router.post('/:id/members', [
  auth,
  check('email', 'Email is required').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, role } = req.body;

  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if user is the team owner
    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to add members to this team' });
    }

    // Find user by email
    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await TeamMember.findOne({
      where: {
        team_id: req.params.id,
        user_id: user.id
      }
    });

    if (existingMember) {
      return res.status(400).json({ msg: 'User is already a member of this team' });
    }

    // Add user to team
    const teamMember = await TeamMember.create({
      team_id: req.params.id,
      user_id: user.id,
      role: role || 'member'
    });

    // Get the team member with user info
    const newMember = await TeamMember.findByPk(teamMember.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(newMember);
  } catch (err) {
    console.error('Error in add team member:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/teams/:id/members/:memberId
// @desc    Remove a member from a team
// @access  Private
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if user is the team owner
    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to remove members from this team' });
    }

    // Find team member
    const teamMember = await TeamMember.findOne({
      where: {
        id: req.params.memberId,
        team_id: req.params.id
      }
    });

    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    // Remove member
    await teamMember.destroy();

    res.json({ msg: 'Team member removed' });
  } catch (err) {
    console.error('Error in remove team member:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/teams/:id/members/:memberId
// @desc    Update a team member's role
// @access  Private
router.put('/:id/members/:memberId', [
  auth,
  check('role', 'Role is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role } = req.body;

  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    // Check if user is the team owner
    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update members in this team' });
    }

    // Find team member
    const teamMember = await TeamMember.findOne({
      where: {
        id: req.params.memberId,
        team_id: req.params.id
      }
    });

    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    // Update role
    teamMember.role = role;
    await teamMember.save();

    // Get the updated team member with user info
    const updatedMember = await TeamMember.findByPk(teamMember.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedMember);
  } catch (err) {
    console.error('Error in update team member:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
