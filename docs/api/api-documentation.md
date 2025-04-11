# EzerAI API Documentation

## Overview

This document provides comprehensive documentation for the EzerAI API, which powers the lead predictability and AI sales training application. The API is built using Node.js, Express, and PostgreSQL, and follows RESTful principles.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.ezerai.com/api
```

For local development:

```
http://localhost:5000/api
```

## Authentication

EzerAI uses JWT (JSON Web Token) for authentication. Most endpoints require a valid token to be included in the request header.

### Headers

```
x-auth-token: <your_jwt_token>
```

### Authentication Endpoints

#### Register a New User

```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Authenticated User

```
GET /auth
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "company_name": "ACME Inc",
  "created_at": "2025-04-10T12:00:00.000Z",
  "updated_at": "2025-04-10T12:00:00.000Z"
}
```

#### Update Password

```
PUT /auth/password
```

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "msg": "Password updated successfully"
}
```

#### Update Profile

```
PUT /auth/profile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "role": "user",
  "company_name": "ACME Inc",
  "created_at": "2025-04-10T12:00:00.000Z",
  "updated_at": "2025-04-11T12:00:00.000Z"
}
```

## Team Management

### Team Endpoints

#### Get All Teams

```
GET /teams
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Sales Team",
    "description": "Main sales team",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "owner": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "team_members": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "team_id": "550e8400-e29b-41d4-a716-446655440001",
        "user_id": "550e8400-e29b-41d4-a716-446655440003",
        "role": "member",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ],
    "created_at": "2025-04-10T12:00:00.000Z",
    "updated_at": "2025-04-10T12:00:00.000Z"
  }
]
```

#### Get Team by ID

```
GET /teams/:id
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Sales Team",
  "description": "Main sales team",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "owner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "team_members": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "team_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440003",
      "role": "member",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  ],
  "created_at": "2025-04-10T12:00:00.000Z",
  "updated_at": "2025-04-10T12:00:00.000Z"
}
```

#### Create Team

```
POST /teams
```

**Request Body:**
```json
{
  "name": "Marketing Team",
  "description": "Digital marketing team"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "name": "Marketing Team",
  "description": "Digital marketing team",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "owner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "created_at": "2025-04-11T12:00:00.000Z",
  "updated_at": "2025-04-11T12:00:00.000Z"
}
```

#### Update Team

```
PUT /teams/:id
```

**Request Body:**
```json
{
  "name": "Marketing Team 2.0",
  "description": "Updated digital marketing team"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "name": "Marketing Team 2.0",
  "description": "Updated digital marketing team",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "owner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "team_members": [],
  "created_at": "2025-04-11T12:00:00.000Z",
  "updated_at": "2025-04-11T13:00:00.000Z"
}
```

#### Delete Team

```
DELETE /teams/:id
```

**Response:**
```json
{
  "msg": "Team deleted"
}
```

#### Add Team Member

```
POST /teams/:id/members
```

**Request Body:**
```json
{
  "email": "member@example.com",
  "role": "member"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "team_id": "550e8400-e29b-41d4-a716-446655440004",
  "user_id": "550e8400-e29b-41d4-a716-446655440006",
  "role": "member",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "name": "Team Member",
    "email": "member@example.com"
  },
  "created_at": "2025-04-11T14:00:00.000Z",
  "updated_at": "2025-04-11T14:00:00.000Z"
}
```

#### Update Team Member Role

```
PUT /teams/:id/members/:memberId
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "team_id": "550e8400-e29b-41d4-a716-446655440004",
  "user_id": "550e8400-e29b-41d4-a716-446655440006",
  "role": "admin",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440006",
    "name": "Team Member",
    "email": "member@example.com"
  },
  "created_at": "2025-04-11T14:00:00.000Z",
  "updated_at": "2025-04-11T15:00:00.000Z"
}
```

#### Remove Team Member

```
DELETE /teams/:id/members/:memberId
```

**Response:**
```json
{
  "msg": "Team member removed"
}
```

## AI Sales Training

### Training Endpoints

#### Get Training Modules

```
GET /ai-training/modules
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "title": "Effective Cold Calling",
    "description": "Learn techniques for successful cold calling",
    "difficulty": "intermediate",
    "duration_minutes": 45,
    "category": "prospecting",
    "completion_rate": 78,
    "created_at": "2025-04-01T12:00:00.000Z",
    "updated_at": "2025-04-01T12:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440008",
    "title": "Objection Handling",
    "description": "Master the art of handling sales objections",
    "difficulty": "advanced",
    "duration_minutes": 60,
    "category": "negotiation",
    "completion_rate": 65,
    "created_at": "2025-04-02T12:00:00.000Z",
    "updated_at": "2025-04-02T12:00:00.000Z"
  }
]
```

#### Get Training Module by ID

```
GET /ai-training/modules/:id
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440007",
  "title": "Effective Cold Calling",
  "description": "Learn techniques for successful cold calling",
  "difficulty": "intermediate",
  "duration_minutes": 45,
  "category": "prospecting",
  "content": "Detailed module content...",
  "quiz": [
    {
      "question": "What is the best time to make cold calls?",
      "options": ["Early morning", "Late afternoon", "During lunch", "Weekends"],
      "correct_answer": 1
    }
  ],
  "completion_rate": 78,
  "created_at": "2025-04-01T12:00:00.000Z",
  "updated_at": "2025-04-01T12:00:00.000Z"
}
```

#### Get User Progress

```
GET /ai-training/progress
```

**Response:**
```json
{
  "completed_modules": 5,
  "total_modules": 12,
  "completion_percentage": 41.67,
  "modules": [
    {
      "module_id": "550e8400-e29b-41d4-a716-446655440007",
      "title": "Effective Cold Calling",
      "status": "completed",
      "score": 90,
      "completed_at": "2025-04-05T14:30:00.000Z"
    },
    {
      "module_id": "550e8400-e29b-41d4-a716-446655440008",
      "title": "Objection Handling",
      "status": "in_progress",
      "progress_percentage": 60
    }
  ]
}
```

#### Submit Module Quiz

```
POST /ai-training/modules/:id/quiz
```

**Request Body:**
```json
{
  "answers": [1, 0, 2, 1, 3]
}
```

**Response:**
```json
{
  "score": 80,
  "correct_answers": 4,
  "total_questions": 5,
  "feedback": [
    {
      "question_index": 2,
      "is_correct": false,
      "correct_answer": 3,
      "explanation": "The correct approach is to..."
    }
  ],
  "module_completed": true,
  "next_recommended_module": "550e8400-e29b-41d4-a716-446655440009"
}
```

#### Get Performance Metrics

```
GET /ai-training/metrics
```

**Response:**
```json
{
  "call_metrics": {
    "total_calls": 120,
    "average_duration": 5.3,
    "conversion_rate": 12.5,
    "calls_per_day": 24
  },
  "comparison": {
    "team_average": {
      "total_calls": 100,
      "average_duration": 4.8,
      "conversion_rate": 10.2,
      "calls_per_day": 20
    },
    "top_performer": {
      "total_calls": 150,
      "average_duration": 4.2,
      "conversion_rate": 18.3,
      "calls_per_day": 30
    }
  },
  "trend": [
    {
      "date": "2025-04-01",
      "calls": 22,
      "conversions": 2
    },
    {
      "date": "2025-04-02",
      "calls": 25,
      "conversions": 3
    }
  ]
}
```

#### Get AI Insights

```
GET /ai-training/insights
```

**Response:**
```json
{
  "insights": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "type": "improvement",
      "priority": "high",
      "title": "Increase Call Volume",
      "description": "Your call volume is 20% below team average. Consider increasing daily calls to improve results.",
      "action_items": [
        "Schedule dedicated calling blocks",
        "Set daily call targets",
        "Reduce preparation time per call"
      ],
      "created_at": "2025-04-10T09:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "type": "strength",
      "priority": "medium",
      "title": "Strong Objection Handling",
      "description": "Your objection handling skills are 15% above team average. Continue leveraging this strength.",
      "created_at": "2025-04-10T09:00:00.000Z"
    }
  ]
}
```

#### Schedule Coaching Session

```
POST /ai-training/coaching
```

**Request Body:**
```json
{
  "topic": "Improving Cold Call Conversion",
  "preferred_date": "2025-04-15T14:00:00.000Z",
  "notes": "I'm struggling with getting prospects to agree to a follow-up meeting"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440012",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "topic": "Improving Cold Call Conversion",
  "scheduled_date": "2025-04-15T14:00:00.000Z",
  "status": "scheduled",
  "notes": "I'm struggling with getting prospects to agree to a follow-up meeting",
  "coach_id": "550e8400-e29b-41d4-a716-446655440013",
  "coach_name": "AI Coach",
  "created_at": "2025-04-11T12:00:00.000Z",
  "updated_at": "2025-04-11T12:00:00.000Z"
}
```

## Lead Predictability

### Lead Endpoints

#### Get Leads

```
GET /leads
```

**Response:**
```json
{
  "total": 120,
  "page": 1,
  "per_page": 20,
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440014",
      "name": "John Smith",
      "email": "john.smith@company.com",
      "company": "ACME Corp",
      "phone": "+1234567890",
      "source": "website",
      "score": 85,
      "status": "qualified",
      "created_at": "2025-04-01T12:00:00.000Z",
      "updated_at": "2025-04-10T15:00:00.000Z"
    }
  ]
}
```

#### Get Lead by ID

```
GET /leads/:id
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440014",
  "name": "John Smith",
  "email": "john.smith@company.com",
  "company": "ACME Corp",
  "phone": "+1234567890",
  "source": "website",
  "score": 85,
  "status": "qualified",
  "engagement": {
    "website_visits": 5,
    "email_opens": 3,
    "email_clicks": 2,
    "form_submissions": 1,
    "last_engagement": "2025-04-10T14:30:00.000Z"
  },
  "notes": "Interested in enterprise plan",
  "created_at": "2025-04-01T12:00:00.000Z",
  "updated_at": "2025-04-10T15:00:00.000Z"
}
```

#### Get Lead Scores

```
GET /lead-predictability/scores
```

**Response:**
```json
{
  "lead_scores": [
    {
      "lead_id": "550e8400-e29b-41d4-a716-446655440014",
      "name": "John Smith",
      "company": "ACME Corp",
      "score": 85,
      "factors": {
        "engagement": 30,
        "fit": 25,
        "intent": 20,
        "recency": 10
      },
      "probability": 0.72,
      "estimated_value": 5000,
      "recommended_action": "Contact immediately"
    }
  ]
}
```

#### Get Predictive Analytics

```
GET /lead-predictability/analytics
```

**Response:**
```json
{
  "revenue_prediction": {
    "current_month": 50000,
    "next_month": 65000,
    "confidence": 0.85
  },
  "conversion_rates": {
    "overall": 0.12,
    "by_source": {
      "website": 0.15,
      "referral": 0.22,
      "social": 0.08,
      "email": 0.11
    },
    "by_score_range": {
      "0-20": 0.02,
      "21-40": 0.05,
      "41-60": 0.10,
      "61-80": 0.25,
      "81-100": 0.45
    }
  },
  "pipeline_health": {
    "total_value": 250000,
    "at_risk_value": 35000,
    "healthy_value": 215000,
    "average_deal_size": 12500
  }
}
```

#### Get Constraint Analysis

```
GET /lead-predictability/constraints
```

**Response:**
```json
{
  "constraints": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440015",
      "type": "process",
      "name": "Long response time",
      "description": "Average response time to new leads is 24 hours, reducing conversion by an estimated 15%",
      "impact_score": 8.5,
      "recommended_actions": [
        "Implement automated initial response",
        "Create lead assignment rotation",
        "Set up response time alerts"
      ]
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440016",
      "type": "resource",
      "name": "Limited sales capacity",
      "description": "Current team can handle 100 leads per month, but receiving 150",
      "impact_score": 7.2,
      "recommended_actions": [
        "Prioritize high-scoring leads",
        "Implement lead nurturing for lower scores",
        "Consider adding team members"
      ]
    }
  ]
}
```

## Integrations

### ShiFi Integration

#### Connect ShiFi Account

```
POST /integrations/shifi/connect
```

**Request Body:**
```json
{
  "redirect_uri": "https://app.ezerai.com/integrations/callback"
}
```

**Response:**
```json
{
  "auth_url": "https://auth.shifi.com/oauth/authorize?client_id=client123&redirect_uri=https://app.ezerai.com/integrations/callback&response_type=code&scope=voice,ai"
}
```

#### Complete ShiFi Connection

```
POST /integrations/shifi/callback
```

**Request Body:**
```json
{
  "code": "auth_code_from_shifi"
}
```

**Response:**
```json
{
  "success": true,
  "integration_id": "550e8400-e29b-41d4-a716-446655440017",
  "connected_services": ["voice", "ai"],
  "expires_at": "2026-04-11T00:00:00.000Z"
}
```

#### Get ShiFi Integration Status

```
GET /integrations/shifi/status
```

**Response:**
```json
{
  "connected": true,
  "integration_id": "550e8400-e29b-41d4-a716-446655440017",
  "connected_services": ["voice", "ai"],
  "expires_at": "2026-04-11T00:00:00.000Z",
  "last_sync": "2025-04-11T12:00:00.000Z"
}
```

#### Disconnect ShiFi

```
DELETE /integrations/shifi
```

**Response:**
```json
{
  "success": true,
  "message": "ShiFi integration disconnected successfully"
}
```

### CRM Integrations

#### Connect CRM Account

```
POST /integrations/crm/:provider/connect
```

**Request Body:**
```json
{
  "redirect_uri": "https://app.ezerai.com/integrations/callback"
}
```

**Response:**
```json
{
  "auth_url": "https://auth.ghl.com/oauth/authorize?client_id=client123&redirect_uri=https://app.ezerai.com/integrations/callback&response_type=code&scope=contacts,deals"
}
```

#### Complete CRM Connection

```
POST /integrations/crm/:provider/callback
```

**Request Body:**
```json
{
  "code": "auth_code_from_crm"
}
```

**Response:**
```json
{
  "success": true,
  "integration_id": "550e8400-e29b-41d4-a716-446655440018",
  "provider": "ghl",
  "connected_scopes": ["contacts", "deals"],
  "expires_at": "2026-04-11T00:00:00.000Z"
}
```

#### Get CRM Integration Status

```
GET /integrations/crm/:provider/status
```

**Response:**
```json
{
  "connected": true,
  "integration_id": "550e8400-e29b-41d4-a716-446655440018",
  "provider": "ghl",
  "connected_scopes": ["contacts", "deals"],
  "expires_at": "2026-04-11T00:00:00.000Z",
  "last_sync": "2025-04-11T12:00:00.000Z",
  "sync_status": {
    "contacts": {
      "total": 1250,
      "synced": 1250,
      "last_sync": "2025-04-11T12:00:00.000Z"
    },
    "deals": {
      "total": 85,
      "synced": 85,
      "last_sync": "2025-04-11T12:00:00.000Z"
    }
  }
}
```

#### Sync CRM Data

```
POST /integrations/crm/:provider/sync
```

**Request Body:**
```json
{
  "entities": ["contacts", "deals"]
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "550e8400-e29b-41d4-a716-446655440019",
  "status": "in_progress",
  "estimated_completion_time": "2025-04-11T12:05:00.000Z"
}
```

#### Disconnect CRM

```
DELETE /integrations/crm/:provider
```

**Response:**
```json
{
  "success": true,
  "message": "CRM integration disconnected successfully"
}
```

### Engagement Tracking

#### Create Tracking Pixel

```
POST /engagement-tracking/pixels
```

**Request Body:**
```json
{
  "name": "Website Homepage",
  "type": "website",
  "domain": "example.com",
  "path": "/"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440020",
  "name": "Website Homepage",
  "type": "website",
  "domain": "example.com",
  "path": "/",
  "pixel_code": "<script src=\"https://track.ezerai.com/pixel.js?id=550e8400-e29b-41d4-a716-446655440020\"></script>",
  "created_at": "2025-04-11T12:00:00.000Z",
  "updated_at": "2025-04-11T12:00:00.000Z"
}
```

#### Get Tracking Pixels

```
GET /engagement-tracking/pixels
```

**Response:**
```json
{
  "pixels": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "name": "Website Homepage",
      "type": "website",
      "domain": "example.com",
      "path": "/",
      "total_hits": 1250,
      "created_at": "2025-04-11T12:00:00.000Z",
      "updated_at": "2025-04-11T12:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440021",
      "name": "Email Newsletter",
      "type": "email",
      "total_hits": 350,
      "created_at": "2025-04-10T10:00:00.000Z",
      "updated_at": "2025-04-10T10:00:00.000Z"
    }
  ]
}
```

#### Get Engagement Statistics

```
GET /engagement-tracking/statistics
```

**Response:**
```json
{
  "summary": {
    "total_engagements": 2500,
    "unique_visitors": 1200,
    "average_engagement_time": 125,
    "conversion_rate": 0.08
  },
  "by_source": {
    "website": 1250,
    "email": 650,
    "sms": 350,
    "facebook_ad": 250
  },
  "by_date": [
    {
      "date": "2025-04-01",
      "engagements": 200
    },
    {
      "date": "2025-04-02",
      "engagements": 220
    }
  ],
  "top_pages": [
    {
      "path": "/pricing",
      "visits": 450,
      "average_time": 180
    },
    {
      "path": "/features",
      "visits": 380,
      "average_time": 150
    }
  ]
}
```

## Error Responses

The API uses standard HTTP status codes to indicate the success or failure of requests.

### Common Error Codes

- `400 Bad Request`: The request was invalid or cannot be served.
- `401 Unauthorized`: Authentication is required or has failed.
- `403 Forbidden`: The authenticated user does not have permission to access the requested resource.
- `404 Not Found`: The requested resource does not exist.
- `500 Internal Server Error`: An error occurred on the server.

### Error Response Format

```json
{
  "msg": "Error message describing what went wrong",
  "errors": [
    {
      "param": "email",
      "msg": "Please include a valid email"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per user

When a rate limit is exceeded, the API will return a `429 Too Many Requests` response with a `Retry-After` header indicating when the client can make requests again.

## Versioning

The API is versioned through the URL path. The current version is v1:

```
https://api.ezerai.com/api/v1/auth/login
```

## Support

For API support, please contact:

- Email: api-support@ezerai.com
- Documentation: https://docs.ezerai.com
