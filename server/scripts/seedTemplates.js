const mongoose = require("mongoose");
const Template = require("../models/Template");

async function seed() {
  await mongoose.connect("mongodb://127.0.0.1:27017/ai-chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const count = await Template.countDocuments();
  if (count === 0) {
    await Template.create([
      {
        name: "General",
        prompt: "Casual conversations and open discussions.",
      },
      {
        name: "Debate",
        prompt: "Structured debates and argumentation.",
      },
    ]);
    console.log("Inserted default templates.");
  } else {
    console.log("Templates already exist.");
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
