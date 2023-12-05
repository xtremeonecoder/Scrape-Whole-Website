import axios, { AxiosResponse } from "axios";
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

// List of traversed page links
const traversedPages: string[] = [];

// Donwload directory
const downloadDir = "./downloaded_pages";

/**
 * Asynchronous function that downloads a file from a specified URL and saves it to the local filesystem.
 *
 * @param {string} url - The URL of the file to be downloaded.
 * @param {string} filePath - The local path where the file should be saved.
 * @returns {Promise<void>} A promise that resolves when the file is successfully downloaded and saved.
 */
async function downloadFile(url: string, filePath: string): Promise<void> {
  // Implementation details:
  // - Downloads the file from the specified URL.
  // - Saves the file to the local filesystem at the specified path.
  // - Returns a promise that resolves when the download and save process is completed.

  // Local storage directory
  const linkDir = path.dirname(filePath);

  // Get the file content buffer
  const response: AxiosResponse<any, any> = await axios.get(url, {
    responseType: "arraybuffer",
  });

  // Create directories of not exist
  if (!fs.existsSync(linkDir)) {
    fs.mkdir(linkDir, { recursive: true }, (err) => {
      if (err) {
        return console.error(err);
      }

      // Save file to local storage from buffer
      fs.writeFileSync(filePath, Buffer.from(response.data));
    });
  } else {
    // Save file to local storage from buffer
    fs.writeFileSync(filePath, Buffer.from(response.data));
  }
}

/**
 * Asynchronous function that downloads all files specified by a selector and attribute in a Cheerio object.
 *
 * @param {cheerio.CheerioAPI} $ - The Cheerio object representing the parsed HTML.
 * @param {any} selector - The selector used to identify elements containing the files to be downloaded.
 * @param {string} attribute - The attribute within the selected elements containing the file URLs.
 * @param {string} url - The base URL to resolve relative file URLs.
 * @returns {void} Does not return a value.
 */
async function downloadAllFiles(
  $: cheerio.CheerioAPI,
  selector: any,
  attribute: string,
  url: string
): Promise<void> {
  // Implementation details:
  // - Uses the Cheerio object to select elements based on the provided selector.
  // - Extracts file URLs from the specified attribute within the selected elements.
  // - Downloads each file and saves it to the local filesystem, resolving relative URLs with the base URL.
  // - Performs side effects (downloads files), does not return a value.

  const elements = $(selector);

  // Loop through all the elements
  for (const element of elements) {
    // Formulate absolute url of the file
    const fileUrl = new URL($(element).attr(attribute)!, url).href;

    // Formulate the local storage path to store the file
    const filePath = `${downloadDir}${fileUrl.split(".com")[1]}`;

    // Download file to local storage
    await downloadFile(fileUrl, filePath);
    // console.log(`---- Downloaded: ${path.basename(filePath)}`);
  }
}

/**
 * Asynchronous function for scraping an individual web page,
 * downloading its resources, and saving them to a specified base directory.
 *
 * @param {string} url - The URL of the specific web page to be scraped.
 * @param {string} baseDir - The base directory where the scraped files will be saved, maintaining the file structure.
 * @returns {Promise<void>} A promise that resolves when the scraping process for the page is completed.
 */
async function scrapePage(url: string, baseDir: string): Promise<void> {
  // Implementation details:
  // - Downloads and saves CSS, JS, and image files specified in the web page.
  // - Saves the HTML content of the page locally.
  // - Recursively scrapes linked pages found in the content.
  // - Displays progress information in the console during execution.

  // Get web page contents and initiate cheerio instance
  const response: AxiosResponse<any, any> = await axios.get(url);
  const $: cheerio.CheerioAPI = cheerio.load(response.data);

  // Extract and download CSS, Icons files
  void downloadAllFiles($, "link[href]", "href", url);

  // Extract and download javascript files
  void downloadAllFiles($, "script[src]", "src", url);

  // Extract and download image files
  void downloadAllFiles($, "img[src]", "src", url);

  // Save the HTML file
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Formulate file name
  const fileName =
    path.basename(url) !== "books.toscrape.com"
      ? path.basename(url)
      : "index.html";

  // Write fetched html contents to the specified file and store into the local machine
  fs.writeFileSync(path.join(baseDir, fileName), response.data);

  // Recursively scrape linked pages found in the content
  let linkedPages = Array.from(
    new Set(
      $(".col-sm-8.col-md-9 a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
    )
  );

  // Traverse every linked pages found in the content
  for (const linkedPage of linkedPages) {
    // Formulate absolute web page link
    const linkedUrl = new URL(linkedPage, url).href;

    // Formulate local storage directory to store the files
    const linkedBaseDir = path.join(baseDir, path.dirname(linkedPage));

    // Check if the web page is scraped or not?
    if (traversedPages.includes(linkedUrl)) continue;

    // Progress message to console
    console.log(`--- Downloading Sub Page: ${linkedUrl}`);

    // Create directories if not exist
    if (!fs.existsSync(linkedBaseDir)) {
      fs.mkdirSync(linkedBaseDir, { recursive: true });
    }

    // Track the web pages that are scraped
    traversedPages.push(linkedUrl);

    // Call the function recursively for each links found in the content
    await scrapePage(linkedUrl, linkedBaseDir);

    // Progress message to console
    console.log(`--- Downloaded Sub Page: ${linkedUrl}`);
    console.log("\n-----------------------------------------------\n");
  }
}

/**
 * Asynchronous function that reads a CSS file, extracts URLs
 * specified in 'url()' functions, and returns an array of extracted URLs.
 *
 * @param {string} cssPath - The path to the CSS file.
 * @returns {Promise<string[]>} A promise that resolves with an array of extracted URLs.
 */
async function extractUrlsFromCSS(cssPath: string): Promise<string[]> {
  // Implementation details:
  // - Reads the content of the specified CSS file.
  // - Parses the CSS content to identify and extract URLs within 'url()' functions.
  // - Returns an array of extracted URLs.

  // Reads the content of the specified CSS file
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  // Identify and extract URLs within 'url()' functions
  const urlRegex = /url\(['"]?([^'"]+)['"]?\)/g;
  const matches = cssContent.match(urlRegex);

  // Returns an array of extracted URLs
  return matches ? matches.map((match) => match.replace(urlRegex, "$1")) : [];
}

/**
 * Asynchronous function that downloads resources specified by URLs and saves them locally.
 *
 * @param {string} url - The base website URL where the resources are hosted.
 * @param {string[]} fileLinks - An array of file links (URLs) to be downloaded.
 * @returns {void} Does not return a value; performs side effects (downloads files).
 */
async function downloadResourcesFromUrls(
  url: string,
  fileLinks: string[]
): Promise<void> {
  // Implementation details:
  // - Downloads resources specified by URLs and saves them locally.

  // Loop through the available links
  for (const fileLink of fileLinks) {
    // Formulate file absolute url
    const absoluteUrl = new URL(`/static/oscar/css/${fileLink}`, url).href;

    // Formulate local storage directory to store the files
    const resourcePath = `${downloadDir}${absoluteUrl.split(".com")[1]}`;

    // Download the file
    await downloadFile(absoluteUrl, resourcePath);

    // Progress message to console
    console.log(`--- Downloaded File: ${path.basename(absoluteUrl)}`);
  }
}

/**
 * Asynchronous function that combines the process of extracting
 * URLs from CSS and downloading the corresponding files.
 *
 * @param {string} url - The base website URL where the CSS file is hosted.
 * @returns {Promise<void>} A promise that resolves when the extraction and download process is completed.
 */
async function extractUrlsFromCSSAndDownloadFiles(url: string): Promise<void> {
  // Implementation details:
  // - Combines the steps of extracting URLs from a CSS file and downloading the corresponding files.
  // - Involves reading the CSS file, extracting URLs, and initiating downloads.
  // - Returns a promise that resolves when the process is completed.

  // Formulate css file path to scan for dependancy links
  const cssPath = path.join(downloadDir, "static/oscar/css", "styles.css");

  // Check if file exists?
  if (fs.existsSync(cssPath)) {
    // Extract dependancy file links
    const fileLinks = await extractUrlsFromCSS(cssPath);

    // Download dependancy files
    await downloadResourcesFromUrls(url, fileLinks);

    // Progress message to console
    console.log("\n-----------------------------------------------\n");
  }
}

/**
 * Asynchronous function for recursively scraping a website and downloading its resources.
 *
 * @param {string} url - The URL of the website to be scraped.
 * @returns {Promise<void>} A promise that resolves when the web scraping process is completed.
 */
async function scrapeWebsite(url: string): Promise<void> {
  // Implementation details:
  // - Recursively traverses all pages on the specified website.
  // - Downloads and saves files (e.g., HTML, CSS, JS, images, and CSS dependancy files) to disk, maintaining the file structure.
  // - Displays progress information in the console during the execution.

  // Get website content and initiate cheerio instance
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
    // Formulate absolute web link
    const pageUrl = new URL(pageLink, url).href;

    // Formulate local storage directory to store the files
    const pageDir = path.join(downloadDir, path.dirname(pageLink));

    // Check of the web page is scraped or not?
    if (traversedPages.includes(pageUrl)) continue;

    // Create direcories if not exist
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    // Track the web pages that are scraped
    traversedPages.push(pageUrl);

    // Progress message to console
    console.log(`Downloading Page: ${pageUrl}`);

    // Call the function recursively for each links found in the sidebar
    await scrapePage(pageUrl, pageDir);

    // Progress message to console
    console.log(`Downloaded Page: ${pageUrl}`);
    console.log("\n-----------------------------------------------\n");
  }

  // Progress message to console
  console.log("Downloading CSS Dependancies:");

  // Download css dependancy files (such as - fontawesome and so on)
  await extractUrlsFromCSSAndDownloadFiles(url);

  // Progress message to console
  console.log("Downloaded CSS Dependancies:");
  console.log("\n-----------------------------------------------\n");
}

export default scrapeWebsite;
