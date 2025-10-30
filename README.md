# RealEstateHub Scraper

This project is a web scraper designed to collect information about new real estate development programs. It uses Nightmare.js for browser automation and data collection.

## Prerequisites

- Node.js (recommended version: 14.x or higher)
- Yarn or npm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/prolez/realestatehub-scraper.git
cd realestatehub-scraper
```

2. Install dependencies:
```bash
yarn install
# or with npm
npm install
```

## Configuration

The scraper is configured to browse through new real estate development program pages. The main files are:

- `property-scraper.js`: Main script for property scraping
- `locations.js`: Location data management
- `locations-patch.js`: Patches for location data

### Database Population Scripts

#### Locations Management

The project includes two scripts for managing location data in your database:

1. `locations.js`: Populates the database with French cities and postal codes
   - Fetches data from the French Government Geo API
   - Focuses on the Île-de-France region (Region 11)
   - Creates location entries with:
     - City name
     - City slug (lowercase, no diacritics)
     - INSEE code
     - Postal code

   To run the locations script:
   ```bash
   node locations.js
   ```

2. `locations-patch.js`: Updates existing location records
   - Links locations with their corresponding departments
   - Patches existing records based on postal code patterns
   - Includes rate limiting (250ms between requests)

   To run the patch script:
   ```bash
   node locations-patch.js
   ```

Configuration required:
- Update the `url` constant with your API endpoint
- Set your `token` for API authentication
- Adjust the sleep duration (default: 250ms) if needed

The scripts use Bearer token authentication. Make sure to update the token in both files before running them.

## Usage

To run the scraper:

```bash
node property-scraper.js
```

The scraper will:
1. Open an automated browser
2. Browse through real estate program pages
3. Collect relevant information
4. Save the retrieved data

## Dependencies

- `nightmare` (v3.0.2): Browser automation framework
- `vo` (v4.0.2): Generator management for more readable code
- `axios` (v0.24.0): HTTP client for network requests

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

PROLEZ

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
