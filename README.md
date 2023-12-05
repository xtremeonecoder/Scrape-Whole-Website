# Scrape Whole Website

A simple node.js application for scraping the whole website contents and storing them in local machine according to the content file structure of the website. I'm using website [https://books.toscrape.com/](https://books.toscrape.com/) for scraping.

## Development Environment Setup

No matter what IDE you are using for the development, but it is recommended to use Visual Studio Code (VSCode).

1. Install Nodejs on your machine (recommanded to install the recent version).
2. Install VSCode on your machine as an IDE.
3. Install git bash on your machine for using git through terminal.

## VSCode IDE Setup

1. Configure **VSCode IDE** according to your way.

## Clone The Project

1. Clone the project on your local machine from the github repository.
2. Change directory to the project root folder.
3. Open your favorite terminal from the project root directory.
4. Now run the below commands step by step for setup and start.

## Available Scripts

Open `git bash` or any other terminal from the project root directory and follow the following steps for up and run the project.

- `npm install` (installs the application dependencies)
- `npm update` (updates the application dependencies)
- `npm start` (starts the application on terminal and starts scraping the given website. Basically, first it builds the production ready application and run the build version of the application.)

## End Result

- If setup is successful, then `npm start` command would execute for couple of munites. Please do not manually terminate the execution of the program. Once the scraping is completed, you will see the following success message.

```
Web scraping completed successfully.
```

- It will create a new directory `downloaded_pages` inside the root of the project. The whole website should be available in that directory.
- Just explore the directory and click on the `index.html` file to open the downloaded website on your favorite browser.
- Now you can browse every pages of the downloaded website offline.

Cheers!!!!
