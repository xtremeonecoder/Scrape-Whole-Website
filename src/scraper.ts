import axios, { AxiosResponse } from "axios";
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

// List of traversed page links
const traversedPages: string[] = [];

// Donwload directory
const downloadDir = "./downloaded_pages";

async function downloadFile(url: string, filePath: string): Promise<void> {
  const linkDir = path.dirname(filePath);
  const response: AxiosResponse<any, any> = await axios.get(url, {
    responseType: "arraybuffer",
  });

  if (!fs.existsSync(linkDir)) {
    fs.mkdir(linkDir, { recursive: true }, (err) => {
      if (err) {
        return console.error(err);
      }

      fs.writeFileSync(filePath, Buffer.from(response.data));
    });
  } else {
    fs.writeFileSync(filePath, Buffer.from(response.data));
  }
}

function downloadAllFiles(
  $: cheerio.CheerioAPI,
  selector: any,
  attribute: string,
  url: string
): void {
  $(selector).each((_: number, element: cheerio.Element): void => {
    const fileUrl = new URL($(element).attr(attribute)!, url).href;
    const filePath = `${downloadDir}${fileUrl.split(".com")[1]}`;

    void downloadFile(fileUrl, filePath);
    // console.log(`---- Downloaded: ${path.basename(filePath)}`);
  });
}

async function scrapePage(url: string, baseDir: string): Promise<void> {
  const response: AxiosResponse<any, any> = await axios.get(url);
  const $: cheerio.CheerioAPI = cheerio.load(response.data);

  // Extract and download CSS, Icons files
  downloadAllFiles($, "link[href]", "href", url);

  // Extract and download javascript files
  downloadAllFiles($, "script[src]", "src", url);

  // Extract and download image files
  downloadAllFiles($, "img[src]", "src", url);

  // Save the HTML file
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const fileName =
    path.basename(url) !== "books.toscrape.com"
      ? path.basename(url)
      : "index.html";
  const pagePath = path.join(baseDir, fileName);
  fs.writeFileSync(pagePath, response.data);

  // Recursively scrape linked pages
  let linkedPages = Array.from(
    new Set(
      $(".col-sm-8.col-md-9 a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
    )
  );

  // Traverse every linked pages in the content
  for (const linkedPage of linkedPages) {
    const linkedUrl = new URL(linkedPage, url).href;
    const linkedBaseDir = path.join(baseDir, path.dirname(linkedPage));

    if (traversedPages.includes(linkedUrl)) continue;

    console.log(`--- Downloading Sub Page: ${linkedUrl}`);

    if (!fs.existsSync(linkedBaseDir)) {
      fs.mkdirSync(linkedBaseDir, { recursive: true });
    }

    traversedPages.push(linkedUrl);

    await scrapePage(linkedUrl, linkedBaseDir);
    console.log(`--- Downloaded Sub Page: ${linkedUrl}`);
    console.log("\n-----------------------------------------------\n");
  }
}

async function extractUrlsFromCSS(cssPath: string): Promise<string[]> {
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  const urlRegex = /url\(['"]?([^'"]+)['"]?\)/g;
  const matches = cssContent.match(urlRegex);
  return matches ? matches.map((match) => match.replace(urlRegex, "$1")) : [];
}

function downloadResourcesFromUrls(url: string, fileLinks: string[]): void {
  for (const fileLink of fileLinks) {
    const absoluteUrl = new URL(`/static/oscar/css/${fileLink}`, url).href;
    const resourcePath = `${downloadDir}${absoluteUrl.split(".com")[1]}`;
    void downloadFile(absoluteUrl, resourcePath);
    console.log(`--- Downloaded File: ${path.basename(absoluteUrl)}`);
  }
}

async function extractUrlsFromCSSAndDownloadFiles(url: string) {
  const cssPath = path.join(downloadDir, "static/oscar/css", "styles.css");

  if (fs.existsSync(cssPath)) {
    const fileLinks = await extractUrlsFromCSS(cssPath);
    await downloadResourcesFromUrls(url, fileLinks);
    console.log("\n-----------------------------------------------\n");
  }
}

export async function scrapeWebsite(url: string): Promise<void> {
  // Get website content
  const response: AxiosResponse<any, any> = await axios.get(url);
  const $: cheerio.CheerioAPI = cheerio.load(response.data);

  // Recursively scrape linked pages
  let pageLinks = Array.from(
    new Set(
      $(".sidebar a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
    )
  );

  // Add website home page
  pageLinks = ["index.html", ...pageLinks];

  // Traverse every page of sidebar
  for (const pageLink of pageLinks) {
    const pageUrl = new URL(pageLink, url).href;
    const pageDir = path.join(downloadDir, path.dirname(pageLink));

    if (traversedPages.includes(pageUrl)) continue;

    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    traversedPages.push(pageUrl);

    console.log(`Downloading Page: ${pageUrl}`);
    await scrapePage(pageUrl, pageDir);
    console.log(`Downloaded Page: ${pageUrl}`);
    console.log("\n-----------------------------------------------\n");
  }

  console.log("Downloading CSS Dependancies:");
  extractUrlsFromCSSAndDownloadFiles(url);
  console.log("Downloaded CSS Dependancies:");
  console.log("\n-----------------------------------------------\n");
}
