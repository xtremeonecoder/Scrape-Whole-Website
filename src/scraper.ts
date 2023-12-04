import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

// Donwload directory
const downloadDir = "./downloaded_pages";

async function scrapePage(url: string, baseDir: string): Promise<void> {
  const response: AxiosResponse<any, any> = await axios.get(url);
  const $: cheerio.CheerioAPI = cheerio.load(response.data);

  // Save the HTML file
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const pagePath = path.join(baseDir, "index.html");
  fs.writeFileSync(pagePath, response.data);
}

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

    await scrapePage(pageUrl, pageDir);
  }
}
