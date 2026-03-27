# EasyHome

![Contributors](https://img.shields.io/badge/team-4%20members-blue)
![Project](https://img.shields.io/badge/project-PropTech-green)
![Status](https://img.shields.io/badge/status-Active-orange)

> Smart Homes. Smart Data. Smart Investments.

EasyHome is a PropTech platform that combines real estate, data science, and smart housing technology to make property development and investment smarter, more affordable, and data-driven.

## Features

- Smart modular housing design
- Property investment prediction
- Data-driven land value analysis
- AI smart neighborhood planning
- Real estate analytics dashboard
- Interswitch payment flow for property checkout

## Technologies

- React and Expo
- React Native Web
- Node.js and Express
- Interswitch integration

## Use Cases

- Predict real estate investment opportunities
- Analyze housing price trends
- Plan smart residential developments
- Optimize housing energy consumption
- Rent houses seamlessly

## Setup

1. Install dependencies.

```bash
npm install
```

2. Start the Expo app.

```bash
npm run start
```

3. For web preview, run:

```bash
npm run web
```

## Local tunnel workflow

Use this when testing mobile payments without deploying the backend.

1. Start the payment backend in one terminal.

```bash
npm run backend:start
```

2. Start the HTTPS tunnel in a second terminal.

```bash
npm run backend:tunnel
```

This writes `EXPO_PUBLIC_API_BASE_URL` into the root `.env` file automatically using the public tunnel URL.

3. Restart Expo after the tunnel URL has been written.

## Payment backend

The Interswitch checkout does not fall back to `http://127.0.0.1:3001`, `http://10.0.2.2:3001`, or the Expo LAN host. The app requires `EXPO_PUBLIC_API_BASE_URL` and will show a configuration error until it is set.

Backend secrets for the payment server still live in `backend/.env`.

## How It Works

1. Collect real estate and user data
2. Analyze using data science models
3. Predict high-growth investment areas

## Sample Output

- Investment scoring system
- Location ranking
- Data-driven housing insights

## Team Contributions

### UI/UX Designer
Akinola Daniel

- Designed user interface and experience
- Created intuitive and user-friendly layouts

### Developer
Onuosa Daniel

- Built core application logic
- Implemented backend systems
- Integrated data processing features
- Implemented the Interswitch API flow

### Co-Developer
Emmanuel Odukoya

- Assisted in development and debugging
- Supported feature implementation
- Collaborated on system architecture

### Project Manager / Founder
Obisesan Kolade

- Led project vision and execution
- Coordinated team activities
- Defined product strategy and direction

## Vision

We are building a data-driven future for real estate by combining technology, design, and innovation to make housing smarter and more accessible.

## Future Improvements

- AI property valuation
- Smart mortgage system
- Real-time housing analytics dashboard
- Expansion across Africa
