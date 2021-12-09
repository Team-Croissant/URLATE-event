import express from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require(__dirname + "/../config/config.json");

const app = express();
app.locals.pretty = true;

app.set("view engine", "ejs");
app.set("views", __dirname + "/../views");
app.use(express.static(__dirname + "/../public"));

app.get("/", (req, res) => {
  res.render("index", {
    url: config.project.url,
    api: config.project.api,
  });
});

app.listen(config.project.port, () => {
  console.log(`HTTP Server running at port ${config.project.port}.`);
});
