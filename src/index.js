/**
 * THIS COMPUTE CODE RUNS ON THE FASTLY EDGE 🚀
 * The functionality here runs at your edgecompute.app domain
 *
 * ⚠️ Make sure you publish again whenever you make a change here
 */

// We're using expressly https://expressly.edgecompute.app
import { Router } from "@fastly/expressly";
import { getGeolocationForIpAddress } from "fastly:geolocation";
import getUnicodeFlagIcon from "country-flag-icons/unicode";

const router = new Router();
let originResponse;

// Generic rules for how we handle requests
router.use(async (req, res) => {
  // Set the origin backend we specify in the toml
  originResponse = await fetch(req, {
    backend: "origin_0",
  });
});

// CUSTOMIZATION BASED ON GEO
// Return a style sheet based on the time of day
router.get("/origin.css", async (req, res) => {
  // You can view the console output using fastly log-tail
  console.info("Stylesheet request");
  // We're going to request a different url
  let url = new URL(req.url);
  // Switch out the stylesheet
  url.pathname = "/edge.css";

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
  <link rel="stylesheet" href="/edge.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
  
  <div class="wrapper">
  <div class="content" role="main">
    <h1 class="edge">Edge Website</h1>
    <div class="publish"></div>
    <div>
    <div class="data"><p>${data.info}</p></div>
    <p>This data came back from the origin as JSON and the compute logic returned it inside an HTML page.</p>
    <p><a href="/">Home</a></p>
    </div>
    <div id="remix">
      <a class="btn--remix" target="_top" href="https://glitch.com/edit/#!/remix/origin-website">
        <img src="https://cdn.glitch.com/605e2a51-d45f-4d87-a285-9410ad350515%2FLogo_Color.svg?v=1618199565140" alt="Remix" />
        Remix your own site
      </a>
    </div>
  </div>
  </div>
  </body>
  </html>`;

  // Send the page back as the response
  res.withStatus(originResponse.status).html(page);
});

// Homepage
router.get("/", async (req, res) => {
  let beresp = await fetch(req, { backend: "origin_0" });

  // Get the user location and country flag
  let geo = getGeolocationForIpAddress(req.ip);
  let where = geo.country_name + " " + getUnicodeFlagIcon(geo.country_code);
  // Set the location in a cookie
  res.cookie("where", where);
  res.send(beresp);
});

// For anything other than the routes above, just return the origin response
router.all("(.*)", async (req, res) => {
  res.send(originResponse);
});

router.listen();
