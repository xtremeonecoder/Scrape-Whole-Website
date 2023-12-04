import { scrapeWebsite } from "./scraper";

async function main(): Promise<void> {
  try {
    await scrapeWebsite("https://books.toscrape.com/");
    console.log("Web scraping completed successfully.");
  } catch (error) {
    console.error("An error occurred during web scraping:", error);
  }
}

main();
