import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeWebsite(url: string) {
  // Donwload directory
  const downloadDir = "./downloaded_pages";

  // Get website content
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Recursively scrape linked pages
  let pageLinks = Array.from(
    new Set(
      $("a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
    )
  );

  console.log("pageLinks:", pageLinks);
}
