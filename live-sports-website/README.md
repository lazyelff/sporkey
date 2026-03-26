# Live Sports Website

Welcome to the Live Sports Website project! This application allows users to watch live sports events and stay updated with ongoing matches.

## Features

- Live streaming of sports events
- Display of live match details
- Integration with sports data APIs for real-time updates
- User-friendly interface for easy navigation

## Project Structure

```
live-sports-website
├── public
│   ├── index.html          # Main HTML document
│   └── assets
│       └── styles.css      # CSS styles for the website
├── src
│   ├── components
│   │   ├── MatchList.js    # Component for displaying live matches
│   │   └── VideoPlayer.js   # Component for video playback
│   ├── services
│   │   └── api.js          # API service for fetching sports data
│   └── App.js              # Main application component
├── package.json             # npm configuration file
└── README.md                # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/live-sports-website.git
   ```
2. Navigate to the project directory:
   ```
   cd live-sports-website
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
npm start
```
This will launch the application in your default web browser.

## API Integration

This project utilizes the Streamed.pk API for fetching live match data, team logos, and other relevant information. Please refer to the [Streamed.pk documentation](https://streamed.pk/docs) for more details on the available endpoints and usage.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.