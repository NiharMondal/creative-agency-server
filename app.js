const express = require('express');
const cors = require('cors');
const fs = require('fs-extra')
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();

app.use(express.json())
app.use(cors());
app.use(express.static('service'));
app.use(fileUpload());

const PORT = process.env.PORT || 4000;


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.slvnc.mongodb.net/creativeAgency?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
   const adminCollection = client.db("creativeAgency").collection("admins");
   const serviceCollection = client.db("creativeAgency").collection("services");
   const feedbackCollection = client.db("creativeAgency").collection("reviews");
   const orderCollection = client.db("creativeAgency").collection("orders");
  // perform actions on the collection object
   console.log("data base connected");
   
   app.get('/', (req, res) => {
      res.send('i am root ')
   });

   app.post('/make-admin', (req, res) => {
      const email = req.body.email;
      adminCollection.insertOne({ email })
         .then(result => {
            res.send(result.insertedCount > 0);
         })
   });

   app.post('/is-admin', (req, res) => {
      const email = req.body.email;
      adminCollection.find({ email: email })
         .toArray((err, isAdmin) => {
            res.send(isAdmin.length > 0)
         })
   });

   app.post('/add-review', (req, res) => {
      const {name,description,position } = req.body;
      feedbackCollection.insertOne({name,position,description})
         .then(review => {
            res.send(review.insertedCount > 0);
      })
   });

   app.get('/get-review', (req, res) => {
      feedbackCollection.find({})
         .toArray((err, rDocuments) => {
            res.send(rDocuments)
         })
   });
   app.get('/my-order', (req, res) => {
      const email = req.headers.email;
      orderCollection.find({ email: email })
         .toArray((err, myOrder) => {
         res.send(myOrder)
      })
   })
   app.get('/get-order', (req, res) => {
      orderCollection.find({})
         .toArray((err, oDocuments) => {
         res.send(oDocuments)
      })
   });
   app.post('/add-order', (req, res) => {
      const { name, email, title, price, details } = req.body;
      orderCollection.insertOne({ name, email, title, price, details, })
         .then(order => {
            res.send(order.insertedCount > 0);
         })
   });

  
   app.get('/all-services', (req, res) => {
      serviceCollection.find({})
         .toArray((err, sDocument) => {
         res.send(sDocument)
      })
   });
   app.post('/add-service', (req, res) => {
      const file = req.files.file;
      const title = req.body.title;
      const description = req.body.description;
      console.log(file, title, description);
      
      const filePath = `${__dirname}/service/${file.name}`;
      
      file.mv(filePath, err => {
         if (err) {
            console.log(err);
            res.status(500).send({ mgs: "Failed to upload image" })
         }
         const newImg = fs.readFileSync(filePath);
         const encImg = newImg.toString('base64');
         let image = {
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer(encImg, 'base64')
         };
         serviceCollection.insertOne({ title, description, image })
            .then(result => {
               fs.remove(filePath, error => {
                  if (error) {
                     console.log(error);
                     res.status(500).send({ mgs: "Failed to upload image" })
                  }
                  res.send(result.insertedCount > 0);
               })
            })
      })
   });

});


app.listen(PORT, () => {
   console.log(`Server connected on port ${PORT}`);
});
