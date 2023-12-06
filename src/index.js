/**
 * THIS COMPUTE CODE RUNS ON THE FASTLY EDGE 🚀
 * Publish your app using the instructions in the TODO
 * Then you'll see the functionality here running at the edgecompute.app domain
 *
 * ⚠️ Make sure you publish again whenever you make a change here
 */

// We're using expressly https://expressly.edgecompute.app
import { Router } from "@fastly/expressly";
import { getGeolocationForIpAddress } from "fastly:geolocation";

const router = new Router();
let originResponse;

// Generic rules for how we handle requests
router.use(async (req, res) => {
  // Set the origin backend we specify in the toml
  originResponse = await fetch(req, {
    backend: "origin_0"
  });
});

// CUSTOMIZATION BASED ON GEO
// Return a style sheet based on the time of day
router.get("/style.css", async (req, res) => {
  // You can view the console output using fastly log-tail
  console.info("Stylesheet request");
  // We're going to request a different url
  let url = new URL(req.url);
  // Get the time at the user location
  let geo, offset;
  let displayTime = new Date().getHours();
  try {
    geo = getGeolocationForIpAddress(req.ip);
    offset = geo.utc_offset;
    displayTime += offset / 100;
  } catch (error) {
    console.error(error);
  }

  // Switch out the stylesheet
  url.pathname = displayTime > 6 && displayTime < 18 ? "/day.css" : "/dark.css";

  // Make the amended request
  let newReq = new Request(url, req);
  res.send(
    await fetch(newReq, {
      backend: "origin_0",
    })
  );
});

// SYNTHETIC CONTENT
// If the request is for the json send it back in a page
router.get("/data.json", async (req, res) => {
  console.info("Data request");
  // Parse the JSON response from the origin
  const data = await originResponse.json();
  // Include the data in a page
  let page = `<html>
  <head>
  <link rel="stylesheet" href="/style.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
  <div class="wrapper">
  <div class="content" role="main">
  <div class="header"><div class="headcontent">
      <div class="publish"></div>
      <div class="headtext">
        <div class="title">Hello Compute!</div>
        <div class="subheading pub">Published to Fastly!</div>
      </div></div>
  </div>
  <div class="banner">
  <div>&#128064; Check out the code in <a href="https://glitch.com/~fastly-hello-compute">Glitch</a>!</div>
  </div>
  <div class="instructions">
  <h2>Origin data transformed</h2>
  <div class="data">${data.info}</div>
    <p>This data came back from the origin as JSON and the compute logic returned it inside an HTML page.</p>
    <p><a href="/">Home</a></p>
    </div>
  </div>
  </div>
  </body>
  </html>`;

  // Send the page back as the response
  res.withStatus(originResponse.status).html(page);
});

// For anything other than the routes above, just return the origin response
router.all("(.*)", async (req, res) => {
  res.send(originResponse);
});

router.listen();
