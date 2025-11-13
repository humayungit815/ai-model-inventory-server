const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ulplndh.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const db = client.db("aiModelDB");
		const modelCollection = db.collection("models");
		const purchasedCollection = db.collection("purchased");

		app.get("/models", async (req, res) => {
			const result = await modelCollection.find().toArray();
			res.send(result);
		});

		app.get("/models/:id", async (req, res) => {
			const id = req.params.id;
			const query = {_id: new ObjectId(id)};
			const result = await modelCollection.findOne(query);
			res.send(result);
		});

		app.put("/update-model/:id", async (req, res) => {
			const id = req.params.id;
			const updateData = req.body;
			const filter = {_id: new ObjectId(id)};
			const updateModel = {
				$set: updateData,
			};
			const result = await modelCollection.updateOne(filter, updateModel);
			res.send(result);
		});

		app.post("/models", async (req, res) => {
			const data = req.body;
			const result = await modelCollection.insertOne(data);
			res.send(result);
		});

		app.delete("/models/:id", async (req, res) => {
			const {id} = req.params;
			const objectId = {_id: new ObjectId(id)};
			const result = await modelCollection.deleteOne(objectId);
			res.send(result);
		});

		app.get("/my-model", async (req, res) => {
			const email = req.query.email;
			const result = await modelCollection.find({createdBy: email}).toArray();
			res.send(result);
		});

		app.post("/purchased", async (req, res) => {
			const data = req.body;
			const result = await purchasedCollection.insertOne(data);

			const modelId = data.modelId;
			await modelCollection.updateOne(
				{_id: new ObjectId(modelId)},
				{$inc: {purchased: 1}}
			);

			res.send({
				success: true,
				result,
			});
		});

		app.get("/purchased", async (req, res) => {
			const result = await purchasedCollection.find().toArray();
			res.send(result);
		});

		app.get("/latest-models", async (req, res) => {
			const result = await modelCollection
				.find()
				.sort({createdAt: -1})
				.limit(6)
				.toArray();
			res.send(result);
		});

		app.get("/search", async (req, res) => {
			const search_text = req.query.search;
			const result = await modelCollection
				.find({name: {$regex: search_text, $options: "i"}})
				.toArray();
			res.send({
				success: true,
				result,
			});
		});

		app.get("/filter", async (req, res) => {
			const {frameworks} = req.query;

			let query = {};

			if (frameworks) {
				const frameworkArray = frameworks.split(",");
				query.framework = {$in: frameworkArray};
			}

			const result = await modelCollection.find(query).toArray();
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ping: 1});
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
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
