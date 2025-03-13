# Round-Robin Coupon Distribution System

A simple web application that distributes coupons to guest users in a round-robin manner while preventing abuse through IP and cookie tracking.

## Features

- Coupon distribution in a round-robin fashion
- Guest access without requiring login
- Abuse prevention through IP and cookie tracking
- Cooldown period between coupon claims
- User-friendly interface with countdown timer
- Coupon history tracking

## Abuse Prevention Strategies

1. **IP Tracking**: The application records the IP address of each user who claims a coupon and restricts subsequent claims from the same IP within a specified time frame (configurable, default: 1 minute).

2. **Cookie Tracking**: The application sets a cookie in the user's browser when they claim a coupon, preventing multiple claims from the same browser session.

3. **Rate Limiting**: The API endpoints are protected with rate limiting to prevent excessive requests from the same IP address.

## Local Development Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd coupon-distribution-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed:
     ```
     PORT=3000
     DB_NAME=coupon_db
     DB_USER=your_db_user
     DB_PASSWORD=your_db_password
     DB_HOST=localhost
     DB_PORT=5432
     CLAIM_COOLDOWN_MINUTES=1
     ```

4. Create the PostgreSQL database:
   ```
   createdb coupon_db
   ```

5. Seed the database with initial coupons:
   ```
   npm run seed
   ```

6. Start the application:
   ```
   npm start
   ```

7. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Deployment Instructions

### Setting up Supabase Database

1. Create a [Supabase](https://supabase.com/) account
2. Create a new project
3. Get your database connection details from the project settings
4. Add the Supabase database details to your environment variables:
   ```
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=your_supabase_db_password
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_HOST=your_supabase_host.supabase.co
   SUPABASE_DB_PORT=5432
   ```
5. Seed your Supabase database:
   ```
   node seedSupabase.js
   ```

### Deploying to Netlify

1. Push your code to a GitHub repository

2. Sign up for [Netlify](https://www.netlify.com/)

3. Connect your GitHub repository to Netlify:
   - Click "New site from Git"
   - Select GitHub and authorize Netlify
   - Choose your repository

4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `public`

5. Add environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add all the Supabase environment variables
   - Add `NODE_ENV=production`
   - Add `CLAIM_COOLDOWN_MINUTES=1` (or your preferred value)

6. Deploy your site:
   - Netlify will automatically deploy your site
   - You can trigger manual deploys from the Netlify dashboard

7. After deployment, you may need to seed your database:
   - Go to Netlify Functions tab
   - Find and run your seed function

## Usage

1. Visit the application in your browser
2. Click the "Claim Coupon" button to claim a coupon
3. If eligible, you will receive a coupon code
4. If not eligible, you will see a countdown timer indicating when you can claim again
5. Click "Check History" to see all your previously claimed coupons

## Testing

To test the abuse prevention mechanisms:

1. Claim a coupon
2. Try to claim another coupon immediately - you should be blocked
3. Try using a different browser or incognito mode - you should still be blocked if on the same IP
4. Wait for the cooldown period to expire - you should be able to claim again 