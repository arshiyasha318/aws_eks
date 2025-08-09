# Doctor Booking System - Frontend

This is the frontend for the Doctor Booking System, built with React, TypeScript, Vite, and Tailwind CSS. It provides a modern, responsive interface for patients and doctors to manage appointments.

## Prerequisites

- Node.js (v22.16.0 or higher recommended)
- npm (v10.9.2 or higher) or yarn
- Backend server (see backend README for setup)
- nvm (Node Version Manager) - Recommended for managing Node.js versions

### Setting Up Node.js with nvm

1. Install nvm (if not already installed):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```
   Then restart your terminal or run:
   ```bash
   source ~/.nvm/nvm.sh
   ```

2. Install and use the correct Node.js version:
   ```bash
   nvm install 22.16.0
   nvm use 22.16.0
   nvm alias default 22
   ```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd go-doctor-booking/frontend
   ```

2. **Set up Node.js version**
   Ensure you're using the correct Node.js version:
   ```bash
   nvm use
   # If the above doesn't work, install and use the correct version:
   nvm install 22.16.0
   nvm use 22.16.0
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Environment Setup**
   Create a `.env` file in the frontend root directory with the following variables:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server with hot module replacement
- `npm run build` - Build the application for production (outputs to `dist/` directory)
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code using Prettier
- `npm test` - Run tests

## Development Workflow

1. **Starting Development**
   ```bash
   nvm use
   npm install
   npm run dev
   ```

2. **Before Committing**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main App component
│   └── main.tsx          # Application entry point
├── .eslintrc.cjs         # ESLint configuration
├── .gitignore
├── index.html
├── package.json
├── README.md
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## Features

- **User Authentication**
  - Login/Registration
  - Protected routes
  - Role-based access control

- **Patient Features**
  - Browse available doctors
  - Book appointments
  - View and manage appointments
  - View medical history

- **Doctor Features**
  - Manage availability
  - View and update appointments
  - Access patient information

## Styling

This project uses Tailwind CSS v3.4.1 for styling. The configuration can be found in `tailwind.config.js`.

### Tailwind CSS Setup

- **PostCSS Configuration**: Located in `postcss.config.js`
- **Tailwind Configuration**: Located in `tailwind.config.js`
- **Main CSS File**: Located at `src/index.css`

### Adding Custom Styles

1. To add custom styles, edit the `src/index.css` file
2. For component-specific styles, use Tailwind's `@apply` directive or add a new CSS module
3. For custom fonts or other assets, add them to the `src/assets/` directory

## Linting and Formatting

- ESLint is used for code linting
- Prettier is used for code formatting
- Run `npm run lint` to check for linting errors
- Run `npm run format` to format the code

## Testing

To run tests:
```bash
npm test
```

## Building for Production

To create a production build:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Docker Support

The application includes Docker support for both development and production environments.

### Prerequisites

- Docker installed on your system
- Docker Compose (recommended)

### Building the Docker Image

1. Build the production image:
   ```bash
   docker build -t doctor-booking-frontend .
   ```

2. Or build with a specific tag:
   ```bash
   docker build -t doctor-booking-frontend:1.0.0 .
   ```

### Running with Docker

1. Run the container:
   ```bash
   docker run -p 8080:80 doctor-booking-frontend
   ```
   The application will be available at `http://localhost:8080`

2. For development with hot-reloading:
   ```bash
   docker-compose up --build
   ```
   This will start the development server with hot-reloading enabled.

### Environment Variables

You can pass environment variables to the container:

```bash
docker run -p 8080:80 \
  -e VITE_API_BASE_URL=http://your-api-url \
  doctor-booking-frontend
```

## Deployment

### Prerequisites for Production
- Ensure all environment variables are properly set in your production environment
- Configure CORS settings on your backend to allow requests from your frontend domain

### Deployment Options

1. **Vercel**
   - Install Vercel CLI: `npm install -g vercel`
   - Run `vercel` and follow the prompts
   - Set environment variables in Vercel dashboard

2. **Netlify**
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Run `netlify deploy`
   - Set environment variables in Netlify dashboard

3. **Static Hosting**
   - Build the app: `npm run build`
   - Deploy the contents of the `dist` directory to your static hosting service

4. **Docker**
   - Build and push your Docker image to a container registry
   - Deploy the container to your preferred container orchestration platform (Kubernetes, ECS, etc.)
   - Example for AWS ECS:
     ```bash
     # Build and push the image
     docker build -t your-ecr-repo/doctor-booking-frontend:1.0.0 .
     docker push your-ecr-repo/doctor-booking-frontend:1.0.0
     
     # Then deploy using your ECS task definition
     ```

### Environment Variables

For production, make sure to set these environment variables:
```
VITE_API_BASE_URL=your-production-api-url
NODE_ENV=production
```

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
