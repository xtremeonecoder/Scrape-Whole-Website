import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

// Donwload directory
const downloadDir = "./downloaded_pages";

export async function scrapeWebsite(url: string): Promise<void> {
  // Get website content
  const response: AxiosResponse<any, any> = await axios.get(url);
  const $: cheerio.CheerioAPI = cheerio.load(response.data);

  // Recursively scrape linked pages
  let pageLinks = Array.from(
    new Set(
      $("a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
    )
  );

  // Traverse every page of sidebar
  for (const pageLink of pageLinks) {
    const pageUrl = new URL(pageLink, url).href;
    const pageDir = path.join(downloadDir, path.dirname(pageLink));

    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    console.log("PageURL:", pageUrl);
  }
}
