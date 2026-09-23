# VIA CABS Trip Log

Mobile-friendly driver trip logging portal for VIA CABS.

## Architecture

`GitHub Pages → Google Apps Script Web App → Private Google Sheet`

The frontend is a static site. Trip records are submitted to the Apps Script endpoint and stored in the private spreadsheet.

## Dummy drivers

- Rahul — MH12AB1234
- Akshay — MH12CD5678
- Prasad — MH14EF9012

Replace these in `app.js` when the real driver/vehicle list is ready.

## GitHub Pages

In the repository, open **Settings → Pages** and choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.

The site will be available at:

`https://kaustubhvkhairnar.github.io/via-cabs/`

## Google Apps Script

The current Apps Script web-app endpoint is configured in `app.js` as `API_URL`.

If the Apps Script deployment URL changes later, update that single value in `app.js` and commit the change.

Keep the Google Sheet private. Drivers only interact with this website and cannot edit submitted spreadsheet rows through the site.
