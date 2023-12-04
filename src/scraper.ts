import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

// Donwload directory
const downloadDir = "./downloaded_pages";

async function downloadFile(url: string, filePath: string): Promise<void> {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(filePath, Buffer.from(response.data));
}

async function scrapePage(url: string, baseDir: string): Promise<void> {
  const response: AxiosResponse<any, any> = await axios.get(url);
  const $: cheerio.CheerioAPI = cheerio.load(response.data);

  // Save the HTML file
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const pagePath = path.join(baseDir, "index.html");
  fs.writeFileSync(pagePath, response.data);

  $('link[rel="stylesheet"]').each(
    (_: number, element: cheerio.Element): void => {
      const cssUrl = new URL($(element).attr("href")!, url).href;
      const cssPath = path.join(baseDir, "styles", path.basename(cssUrl));
      void downloadFile(cssUrl, cssPath);
    }
  );
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
