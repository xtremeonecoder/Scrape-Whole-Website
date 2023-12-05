import { scrapeWebsite } from "./scraper";

/**
 * The main function for initiating web scraping on the specified website.
 * @returns {Promise<void>} A promise that resolves when web scraping is completed.
 */
async function main(): Promise<void> {
  try {
    // Attempt to scrape the specified website
    await scrapeWebsite("https://books.toscrape.com/");

    // Log success message when web scraping is completed without errors
    console.log("Web scraping completed successfully.");
  } catch (error) {
    // Log an error message if an exception occurs during web scraping
    console.error("An error occurred during web scraping:", error);
  }
}

// Initiate the scraping
main();
