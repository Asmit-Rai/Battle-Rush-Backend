const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./capital-rush-01-firebase-adminsdk-fbsvc-f91a43a106.json");
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});


const db = admin.firestore();
app.use(cors());
app.use(express.json());

app.post("/createPost", async (req, res) => {
    const { title, description, userId } = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const postRef = db.collection("posts").doc();
    await postRef.set({ title, description, userId, createdAt: new Date() });
    res.status(200).json({ message: "Post created!" });
});

app.get("/getPost/:userId", async (req, res) => { 
    const { userId } = req.params;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const data = await db.collection("posts").where("userId", "==", userId).orderBy("createdAt", "desc").get();
    res.json(data.docs.map(value => ({ id: value.id, ...value.data() })));
});


app.delete("/deletePost/:id/:userId", async (req, res) => {
    const { id, userId } = req.params;
    const postRef = db.collection("posts").doc(id);
    const post = await postRef.get();

    if (!post.exists) return res.status(404).json({ error: "Post not found" });
    if (post.data().userId !== userId) return res.status(403).json({ error: "Unauthorized" });

    await postRef.delete();
    res.json({ message: "Post deleted!" });
});


app.put("/editPost/:id/:userId", async (req, res) => {
    const { id, userId } = req.params;
    const { title, description } = req.body;
    const postRef = db.collection("posts").doc(id);
    const post = await postRef.get();

    if (!post.exists) return res.status(404).json({ error: "Post not found" });
    if (post.data().userId !== userId) return res.status(403).json({ error: "Unauthorized" });

    await postRef.update({ title, description });
    res.json({ message: "Post updated!" });
});

app.get("/getAllPosts", async (req, res) => {
    try {
      const data = await db.collection("posts").orderBy("createdAt", "desc").get();
      const posts = await Promise.all(
        data.docs.map(async (doc) => {
          const postData = doc.data();
          return {
            id: doc.id,
            ...postData,
          };
        })
      );
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });
  module.exports = app;
