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

    app.get("/all-sectors", async (req, res) => {
      const result = await infos.aggregate(
        [
          {
            $group: {
              _id: "$sector", // Group documents by sector
              total: {$sum:1}
            }
          }



        ]
      ).toArray();
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


    app.get("/insights-trends", async (req, res) => {
      
      const {startYear,endYear,sector}=req.query;
      // console.log(req.query);
      // const startYear = "2016";
      // const endYear = "2016";
      const result  = await infos.aggregate(
        [
          {
              "$addFields": {
                  "parsedDate": {
                      "$dateFromString": {
                          "dateString": "$added",
                          "format": "%B, %d %Y %H:%M:%S"
                      }
                  }
              }
          },
          {
              "$match": {
                  "sector": sector,
                  "parsedDate": {
                      "$gte": new Date(startYear + "-01-01T00:00:00Z"),
                      "$lte": new Date(endYear + "-12-31T23:59:59Z")
                  }
              }
          },
          {
              "$project": {
                  "date": {
                      "$dateToString": {
                          "format": "%Y-%m-%d",
                          "date": "$parsedDate"
                      }
                  },
                  "topic": 1
              }
          },
          {
              "$group": {
                  "_id": {
                      "date": "$date",
                      "topic": "$topic"
                  },
                  "count": { "$sum": 1 }
              }
          },
          {
              "$group": {
                  "_id": "$_id.date",
                  "topics": {
                      "$push": {
                          "topic": "$_id.topic",
                          "count": "$count"
                      }
                  }
              }
          },
          {
              "$sort": {
                  "_id": 1
              }
          },
          {
              "$project": {
                  "_id": 0,
                  "date": "$_id",
                  "topics": {
                      "$arrayToObject": {
                          "$map": {
                              "input": "$topics",
                              "as": "t",
                              "in": { "k": "$$t.topic", "v": "$$t.count" }
                          }
                      }
                  }
              }
          }
      ]
  
      ).toArray();

    console.log(result);
    
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
