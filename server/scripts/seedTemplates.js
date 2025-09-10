require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("../models/Template");
const fs = require("fs");
const path = require("path");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Read each template's prompt from its own markdown file in scripts
  const promptFiles = {
    General: path.resolve(__dirname, "./General.md"),
    Debate: path.resolve(__dirname, "./Debate.md"),
    Brainstorm: path.resolve(__dirname, "./Brainstorm.md"),
  };
  const templates = Object.entries(promptFiles).map(([name, file]) => ({
    name,
    prompt: fs.readFileSync(file, "utf8").trim(),
  }));

  const count = await Template.countDocuments();
  if (count === 0) {
    await Template.create(templates);
    console.log("Inserted default templates from individual markdown files.");
  } else {
    console.log("Templates already exist.");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
