const request = require('supertest');
const app = require('../server');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock models
jest.mock('../models/Team');
jest.mock('../models/TeamMember');
jest.mock('../models/User');

describe('Team Routes', () => {
  let token;
  const userId = '123';
  
  beforeEach(() => {
    // Create a test token
    token = jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET || 'testsecret');
  });

  describe('GET /api/teams', () => {
    it('should get all teams for a user', async () => {
      // Mock Team.findAll for owned teams
      const mockOwnedTeams = [
        {
          id: '1',
          name: 'Team 1',
          description: 'Description 1',
          owner_id: userId,
          owner: {
            id: userId,
            name: 'Test User',
            email: 'test@example.com'
          },
          team_members: []
        }
      ];
      Team.findAll.mockResolvedValueOnce(mockOwnedTeams);
      
      // Mock Team.findAll for member teams
      const mockMemberTeams = [
        {
          id: '2',
          name: 'Team 2',
          description: 'Description 2',
          owner_id: '456',
          owner: {
            id: '456',
            name: 'Another User',
            email: 'another@example.com'
          },
          team_members: [
            {
              id: '1',
              team_id: '2',
              user_id: userId,
              role: 'member',
              user: {
                id: userId,
                name: 'Test User',
                email: 'test@example.com'
              }
            }
          ]
        }
      ];
      Team.findAll.mockResolvedValueOnce(mockMemberTeams);
      
      const res = await request(app)
        .get('/api/teams')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toEqual(2);
      expect(res.body[0].id).toEqual('1');
      expect(res.body[1].id).toEqual('2');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/teams');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('msg', 'No token, authorization denied');
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get a team by ID if user is owner', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId,
        owner: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com'
        },
        team_members: []
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .get('/api/teams/1')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('name', 'Team 1');
      expect(res.body).toHaveProperty('owner');
      expect(res.body.owner).toHaveProperty('id', userId);
    });

    it('should get a team by ID if user is a member', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '2',
        name: 'Team 2',
        description: 'Description 2',
        owner_id: '456',
        owner: {
          id: '456',
          name: 'Another User',
          email: 'another@example.com'
        },
        team_members: [
          {
            id: '1',
            team_id: '2',
            user_id: userId,
            role: 'member',
            user: {
              id: userId,
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        ]
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .get('/api/teams/2')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '2');
      expect(res.body).toHaveProperty('name', 'Team 2');
      expect(res.body).toHaveProperty('owner');
      expect(res.body.owner).toHaveProperty('id', '456');
    });

    it('should return 403 if user is not owner or member', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '3',
        name: 'Team 3',
        description: 'Description 3',
        owner_id: '789',
        owner: {
          id: '789',
          name: 'Third User',
          email: 'third@example.com'
        },
        team_members: []
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .get('/api/teams/3')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('msg', 'Not authorized to access this team');
    });

    it('should return 404 if team not found', async () => {
      // Mock Team.findByPk to return null
      Team.findByPk.mockResolvedValue(null);
      
      const res = await request(app)
        .get('/api/teams/999')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('msg', 'Team not found');
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      // Mock Team.create
      const mockTeam = {
        id: '1',
        name: 'New Team',
        description: 'New Description',
        owner_id: userId
      };
      Team.create.mockResolvedValue(mockTeam);
      
      // Mock Team.findByPk for the created team
      const mockCreatedTeam = {
        ...mockTeam,
        owner: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com'
        }
      };
      Team.findByPk.mockResolvedValue(mockCreatedTeam);
      
      const res = await request(app)
        .post('/api/teams')
        .set('x-auth-token', token)
        .send({
          name: 'New Team',
          description: 'New Description'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('name', 'New Team');
      expect(res.body).toHaveProperty('description', 'New Description');
      expect(res.body).toHaveProperty('owner');
      expect(res.body.owner).toHaveProperty('id', userId);
    });

    it('should return 400 if name is not provided', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('x-auth-token', token)
        .send({
          description: 'New Description'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update a team if user is owner', async () => {
      // Mock Team.findByPk for the initial check
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId,
        save: jest.fn().mockResolvedValue(true)
      };
      Team.findByPk.mockResolvedValueOnce(mockTeam);
      
      // Mock Team.findByPk for the updated team
      const mockUpdatedTeam = {
        id: '1',
        name: 'Updated Team',
        description: 'Updated Description',
        owner_id: userId,
        owner: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com'
        },
        team_members: []
      };
      Team.findByPk.mockResolvedValueOnce(mockUpdatedTeam);
      
      const res = await request(app)
        .put('/api/teams/1')
        .set('x-auth-token', token)
        .send({
          name: 'Updated Team',
          description: 'Updated Description'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('name', 'Updated Team');
      expect(res.body).toHaveProperty('description', 'Updated Description');
      expect(mockTeam.save).toHaveBeenCalled();
    });

    it('should return 403 if user is not the team owner', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '2',
        name: 'Team 2',
        description: 'Description 2',
        owner_id: '456'
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .put('/api/teams/2')
        .set('x-auth-token', token)
        .send({
          name: 'Updated Team',
          description: 'Updated Description'
        });
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('msg', 'Not authorized to update this team');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete a team if user is owner', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      // Mock TeamMember.destroy
      TeamMember.destroy.mockResolvedValue(true);
      
      const res = await request(app)
        .delete('/api/teams/1')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('msg', 'Team deleted');
      expect(mockTeam.destroy).toHaveBeenCalled();
      expect(TeamMember.destroy).toHaveBeenCalled();
    });

    it('should return 403 if user is not the team owner', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '2',
        name: 'Team 2',
        description: 'Description 2',
        owner_id: '456'
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .delete('/api/teams/2')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('msg', 'Not authorized to delete this team');
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add a member to a team', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      // Mock User.findOne
      const mockUser = {
        id: '456',
        name: 'New Member',
        email: 'member@example.com'
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock TeamMember.findOne (member doesn't exist yet)
      TeamMember.findOne.mockResolvedValue(null);
      
      // Mock TeamMember.create
      const mockTeamMember = {
        id: '1',
        team_id: '1',
        user_id: '456',
        role: 'member'
      };
      TeamMember.create.mockResolvedValue(mockTeamMember);
      
      // Mock TeamMember.findByPk for the created member
      const mockCreatedMember = {
        ...mockTeamMember,
        user: mockUser
      };
      TeamMember.findByPk.mockResolvedValue(mockCreatedMember);
      
      const res = await request(app)
        .post('/api/teams/1/members')
        .set('x-auth-token', token)
        .send({
          email: 'member@example.com',
          role: 'member'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', '1');
      expect(res.body).toHaveProperty('team_id', '1');
      expect(res.body).toHaveProperty('user_id', '456');
      expect(res.body).toHaveProperty('role', 'member');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id', '456');
      expect(res.body.user).toHaveProperty('name', 'New Member');
    });

    it('should return 403 if user is not the team owner', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '2',
        name: 'Team 2',
        description: 'Description 2',
        owner_id: '789'
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .post('/api/teams/2/members')
        .set('x-auth-token', token)
        .send({
          email: 'member@example.com',
          role: 'member'
        });
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('msg', 'Not authorized to add members to this team');
    });

    it('should return 404 if user not found', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      // Mock User.findOne (user not found)
      User.findOne.mockResolvedValue(null);
      
      const res = await request(app)
        .post('/api/teams/1/members')
        .set('x-auth-token', token)
        .send({
          email: 'nonexistent@example.com',
          role: 'member'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('msg', 'User not found');
    });

    it('should return 400 if user is already a member', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      // Mock User.findOne
      const mockUser = {
        id: '456',
        name: 'Existing Member',
        email: 'existing@example.com'
      };
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock TeamMember.findOne (member already exists)
      const mockExistingMember = {
        id: '1',
        team_id: '1',
        user_id: '456',
        role: 'member'
      };
      TeamMember.findOne.mockResolvedValue(mockExistingMember);
      
      const res = await request(app)
        .post('/api/teams/1/members')
        .set('x-auth-token', token)
        .send({
          email: 'existing@example.com',
          role: 'member'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('msg', 'User is already a member of this team');
    });
  });

  describe('DELETE /api/teams/:id/members/:memberId', () => {
    it('should remove a member from a team', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      // Mock TeamMember.findOne
      const mockTeamMember = {
        id: '1',
        team_id: '1',
        user_id: '456',
        role: 'member',
        destroy: jest.fn().mockResolvedValue(true)
      };
      TeamMember.findOne.mockResolvedValue(mockTeamMember);
      
      const res = await request(app)
        .delete('/api/teams/1/members/1')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('msg', 'Team member removed');
      expect(mockTeamMember.destroy).toHaveBeenCalled();
    });

    it('should return 403 if user is not the team owner', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '2',
        name: 'Team 2',
        description: 'Description 2',
        owner_id: '789'
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      const res = await request(app)
        .delete('/api/teams/2/members/1')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('msg', 'Not authorized to remove members from this team');
    });

    it('should return 404 if team member not found', async () => {
      // Mock Team.findByPk
      const mockTeam = {
        id: '1',
        name: 'Team 1',
        description: 'Description 1',
        owner_id: userId
      };
      Team.findByPk.mockResolvedValue(mockTeam);
      
      // Mock TeamMember.findOne (member not found)
      TeamMember.findOne.mockResolvedValue(null);
      
      const res = await request(app)
        .delete('/api/teams/1/members/999')
        .set('x-auth-token', token);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('msg', 'Team member not found');
    });
  });
});
