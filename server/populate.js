const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    const restaurants = [
  {
    "Res_Name": "Eat & Repeat By SS",
    "Mobile": "919013258843",
    "Address": "Mayur Vihar Phase 1, New Delhi",
    "Latitude": 28.60445022,
    "Longitude": 77.30223946
  },
  {
    "Res_Name": "Bahu-Belly",
    "Mobile": "917863899899",
    "Address": "Sector 7, Dwarka, New Delhi",
    "Latitude": 28.582899,
    "Longitude": 77.071799
  },
  {
    "Res_Name": "Shyam Evegreen Sweet",
    "Mobile": "919811554135",
    "Address": "Amrapali Dream Valley, Greater Noida",
    "Latitude": 28.59395537,
    "Longitude": 77.45458055
  },
  {
    "Res_Name": "Pulpy Dive - Your Clean F",
    "Mobile": "918884651709",
    "Address": "Sector 75, Noida",
    "Latitude": 28.579067,
    "Longitude": 77.384881
  },
  {
    "Res_Name": "Jain Mumbai Fusion",
    "Mobile": "919818615621",
    "Address": "Sector 63, Noida",
    "Latitude": 28.6206,
    "Longitude": 77.377385
  },
  {
    "Res_Name": "Pooja Tiffin",
    "Mobile": "917683076051",
    "Address": "West Patel Nagar, New Delhi",
    "Latitude": 28.6548258,
    "Longitude": 77.1645842
  },
  {
    "Res_Name": "The Food Mistri",
    "Mobile": "919711046638",
    "Address": "Uttam Nagar, New Delhi",
    "Latitude": 28.62114466,
    "Longitude": 77.03670479
  },
  {
    "Res_Name": "Alauddin biryani bala",
    "Mobile": "919315103382",
    "Address": "Gamma 1, Greater Noida",
    "Latitude": 28.48167735,
    "Longitude": 77.49976069
  },
  {
    "Res_Name": "Hanuman Da Kitchen",
    "Mobile": "919807676977",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.7022858,
    "Longitude": 77.1241845
  },
  {
    "Res_Name": "Khatu Shyam Home Made Tif",
    "Mobile": "919899167131",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.7135724,
    "Longitude": 77.0927604
  },
  {
    "Res_Name": "Ali Shawarma",
    "Mobile": "919582222229",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.69898482,
    "Longitude": 77.10390754
  },
  {
    "Res_Name": "Annapurna’s Blessings",
    "Mobile": "917011606147",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.733782,
    "Longitude": 77.1317259
  },
  {
    "Res_Name": "Kunal Food Center",
    "Mobile": "917827474635",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.7460411,
    "Longitude": 77.0938966
  },
  {
    "Res_Name": "Krishna Foods",
    "Mobile": "919911969897",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.73087068,
    "Longitude": 77.05724381
  },
  {
    "Res_Name": "Wings Masterz",
    "Mobile": "919555455518",
    "Address": "Paschim Vihar, New Delhi",
    "Latitude": 28.67878219,
    "Longitude": 77.08370715
  },
  {
    "Res_Name": "Momos And Chess Burger Va",
    "Mobile": "917503807623",
    "Address": "Paschim Vihar, New Delhi",
    "Latitude": 28.66594782,
    "Longitude": 77.07462721
  },
  {
    "Res_Name": "Kunal Cake House",
    "Mobile": "919871550028",
    "Address": "Paschim Vihar, New Delhi",
    "Latitude": 28.6791395,
    "Longitude": 77.0790024
  },
  {
    "Res_Name": "Viksi’s Kitchen",
    "Mobile": "919667098117",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.7235031,
    "Longitude": 77.0901162
  },
  {
    "Res_Name": "B.B Inc",
    "Mobile": "918700590696",
    "Address": "Prashant Vihar, New Delhi",
    "Latitude": 28.7127956,
    "Longitude": 77.1322378
  },
  {
    "Res_Name": "Khalsa Veg & Non Veg Poin",
    "Mobile": "918826101874",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.725934,
    "Longitude": 77.0566442
  },
  {
    "Res_Name": "Hot Spot Roll Corner",
    "Mobile": "919999488283",
    "Address": "Paschim Vihar, New Delhi",
    "Latitude": 28.6683473,
    "Longitude": 77.101074
  },
  {
    "Res_Name": "Home Food Junction",
    "Mobile": "919582413970",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.70182392,
    "Longitude": 77.0880805
  },
  {
    "Res_Name": "Wah Ji Wah",
    "Mobile": "918447027278",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.71128496,
    "Longitude": 77.06991456
  },
  {
    "Res_Name": "Everest Chinese Hut",
    "Mobile": "918587838180",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.73670846,
    "Longitude": 77.12103143
  },
  {
    "Res_Name": "Bunty The Punjabi Dhaba",
    "Mobile": "919992800200",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.73759423,
    "Longitude": 77.11756669
  },
  {
    "Res_Name": "Mr. Chow",
    "Mobile": "918595689615",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.73024077,
    "Longitude": 77.08003511
  },
  {
    "Res_Name": "Kumaun Bakers",
    "Mobile": "918860333005",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.72623391,
    "Longitude": 77.09509481
  },
  {
    "Res_Name": "Laxmi Kitchen",
    "Mobile": "918851633989",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.73091948,
    "Longitude": 77.05309376
  },
  {
    "Res_Name": "Pizza And Paratha Point",
    "Mobile": "919810736419",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.730189,
    "Longitude": 77.061361
  },
  {
    "Res_Name": "Delhi Wale Bhature",
    "Mobile": "919582190650",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.735,
    "Longitude": 77.0961249
  },
  {
    "Res_Name": "Foodly House",
    "Mobile": "917530879542",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.75593509,
    "Longitude": 77.10511856
  },
  {
    "Res_Name": "Parathas & Momos Corner",
    "Mobile": "917840040065",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.720265,
    "Longitude": 77.089123
  },
  {
    "Res_Name": "Scrumptious Meals By Nitu",
    "Mobile": "919311546228",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.710805,
    "Longitude": 77.398098174
  },
  {
    "Res_Name": "295 Momos",
    "Mobile": "918009504809",
    "Address": "Rohini, New Delhi",
    "Latitude": 28.6995065,
    "Longitude": 77.594098174
  }
];
    // await Restaurant.deleteMany({});
    await Restaurant.insertMany(restaurants);
    console.log('Restaurants inserted');
    mongoose.connection.close();
  })
  .catch(err => console.error(err));