# EzerAI

EzerAI is an AI-powered sales training and lead predictability platform that helps sales teams improve performance and predict sales outcomes.

![EzerAI Logo](docs/assets/logo.png)

## Features

### AI Sales Training
- Personalized training modules based on performance data
- Real-time performance metrics and comparisons
- AI-generated insights and recommendations
- Coaching session scheduling and management

### Lead Predictability
- AI-powered lead scoring and prioritization
- Predictive analytics for revenue forecasting
- Constraint analysis to identify sales bottlenecks
- Engagement tracking across multiple channels

### Integrations
- ShiFi integration for voice engine and AI model
- CRM integrations (GHL, Close, Hubspot)
- Engagement tracking for SMS, ads, website, and more
- Team management with role-based access control

## Tech Stack

- **Frontend**: React, React Router, Context API
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt
- **Testing**: Jest, Supertest

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- PostgreSQL (v14+)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ezerai.git
cd ezerai
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# In the server directory
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

4. Set up the database
```bash
# Create database tables
cd ../server
npm run db:setup
```

5. Start the development servers
```bash
# Start the backend server
npm run server

# In a separate terminal, start the frontend
cd ../client
npm start
```

## Project Structure

```
ezerai/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── context/        # React context providers
│       ├── services/       # API service functions
│       ├── utils/          # Utility functions
│       └── styles/         # CSS styles
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── integrations/       # Third-party integrations
└── docs/                   # Documentation
    ├── api/                # API documentation
    └── assets/             # Documentation assets
```

## API Documentation

For detailed API documentation, see [API Documentation](docs/api/api-documentation.md).

## User Guide

For a comprehensive user guide, see [User Guide](docs/user-guide.md).

## Development

### Running Tests

```bash
# Run server tests
cd server
npm test

# Run client tests
cd ../client
npm test
```

### Code Style

This project uses ESLint and Prettier for code formatting. To check and fix code style:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix
```

## Deployment

For deployment instructions, see [Deployment Guide](docs/deployment/deployment-guide.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ShiFi for providing the voice engine and AI model integration
- All contributors who have helped shape this project
