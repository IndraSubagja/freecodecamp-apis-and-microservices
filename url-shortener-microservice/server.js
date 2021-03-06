require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const shortId = require('shortid')
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}))
app.use(cors());
app.use(express.json())

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Connect to Database
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})

const connection = mongoose.connection
connection.on('error', console.error.bind(console, 'connection error:'))
connection.once('open', () => {
  console.log("MongoDB database connection established succesfully")
})

// Create Model
const Schema = mongoose.Schema
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})

const URL = mongoose.model("URL", urlSchema)

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/new', async function (req, res) {

  const url = req.body.url
  const urlCode = shortId.generate()
  const httpRegex = /^https?:\/\//

  // check if the url is valid or not
  if (!httpRegex.test(url)) {
    res.json({
      error: 'invalid url'
    })
  } else {
    try {
      let findOne = await URL.findOne({original_url: url})

      if(!findOne) {
        findOne = new URL({
          original_url: url, short_url: urlCode
        })

        await findOne.save()
      }

      res.json({original_url: findOne.original_url, short_url: findOne.short_url})
    } catch (err) {
      console.log(err)
      res.status(500).json("Server Error")
    }
  }
})

app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })

    urlParams ? res.redirect(urlParams.original_url) : res.status(404).json('No URL found')

  } catch (err) {
    console.log(err)
    res.status(500).json('Server error')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
