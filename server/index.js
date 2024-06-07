const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;

app.use(cors());
app.use(express.json());
const uri =
  "mongodb+srv://ashikghosh763:ashikghosh763@cluster0.i5znkpq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const infos = client.db("dashboard").collection("infos");

    app.get("/all-infos", async (req, res) => {
      const result = await infos.findOne({ sector: "Energy" });
      return res.send(result);
    });

    app.get("/sector-intensity", async (req, res) => {
      console.log("sector intensity");
      const result = await infos.aggregate([
        {
          $group: {
            _id: "$sector", // Group documents by sector
            avgIntensity: { $avg: "$intensity" }, // Average intensity for each sector
            avgLikelihood: { $avg: "$likelihood" }, // Average likelihood for each sector
            avgRelevance: { $avg: "$relevance" }, // Average relevance for each sector
          }
        }
      ]).toArray();
      return res.send(result);
    });

    app.get("/pie-chart-percentage/:field", async (req, res) => {
     const field = req.params.field;
     console.log(field);
      const result = await infos.aggregate([
       {
        $group:{
          _id: `$${field}`,
          total: {$sum : 1}
        }
       },
       {
        $sort:{
          total: -1
        }
       }
      ]).toArray();
      console.log(result);
      return res.send(result);
    });

    console.log("clicked");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
