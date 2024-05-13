/*
 * Copyright (c) 2024 Logan Miller
 * All rights reserved.
 *
 * This code is the property of Miller Cyber Technologies LLC.
 * Unauthorized use or distribution of this code is strictly prohibited.
 */

var express = require('express');
var router = express.Router();
var middlewares = require('../middlewares.js');
var RunNumber = require('./models/runNumberModel.js');
const { sequelize, DataTypes, Op } = require("sequelize");
const moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Run Number Log' });
});


// Handle /login route and if correct password set req.session.loggedin to true
// This is not a very strong method. You should use a more secure method to authenticate users.
router.post('/login', (req, res) => {
  if(req.body.password === 'change-me-user-password') {
    req.session.loggedin = true;
    req.session.isAdmin = false;
    res.redirect('/list');
  }else if(req.body.password === 'change-me-admin-password') {
    req.session.loggedin = true;
    req.session.isAdmin = true;
    res.redirect('/list');
  }else{
    res.send('Incorrect password');
  }
})

router.get('/list', middlewares.restrictor, async (req, res) => {
  if (!req.session.loggedin) {
      res.redirect('/');
      return;
  }

  try {
      const perPage = parseInt(req.query.perPage) || 25; // Number of runs per page
      const page = parseInt(req.query.page) || 1; // Current page

      // Calculate the offset value based on the page and perPage values
      const offset = (page - 1) * perPage;

      // Get the total count of runs
      const totalCount = await RunNumber.count();

      const runs = await RunNumber.findAll({
        limit: perPage, // Number of runs per page
        offset: offset, // Number of runs to skip (based on the current page)
        order: [['runNumber', 'DESC']]
      });
    
      // Format dates before rendering
      runs.forEach(run => {
        run.date = moment(run.date).format('MM/DD/YYYY'); // Format date using Moment.js
      });

      // Calculate the total number of pages based on totalCount and perPage
      const totalPages = Math.ceil(totalCount / perPage);

      // Admin?
      const isAdmin = req.session.isAdmin;

      // Gather total runs
      const totalRuns = await RunNumber.count();

      // Render the list view with runs and pagination data
      res.render('listview', { runs, totalPages, currentPage: page, perPage, isAdmin, totalRuns, title: 'Run Number Log' });
  } catch (error) {
      console.error('Error fetching run numbers:', error);
      res.status(500).send('Error fetching run numbers');
  }
});

router.get('/runs/add', middlewares.restrictor, async (req, res) => {
  if (!req.session.loggedin) {
      res.redirect('/');
      return;
  }

  try {
      const nextRunNumber = await generateNextRunNumber(); // Generate the next run number
      res.render('addRunView', { nextRunNumber }); // Pass nextRunNumber to the view
  } catch (error) {
      console.error('Error rendering add run view:', error);
      res.status(500).send('Error rendering add run view');
  }
});

router.post('/runs/add', middlewares.restrictor, async (req, res) => {
  if (!req.session.loggedin) {
      // If user is not logged in, redirect to home page
      res.redirect('/');
  } else {
      try {

          // Get the next run number.
          //const nextRunNumber = await generateNextRunNumber();
          // Create a new run number using the data from the request body
          const newRunNumber = await RunNumber.create(req.body);
          // Send a success response indicating the new run number was created
          console.log('Run number added successfully:', newRunNumber);
          res.status(201).json({ message: 'Run number added successfully', runNumber: newRunNumber });
      } catch (error) {
          // Handle any errors that occur during the creation of the run number
          console.error('Error adding run number:', error);
          res.status(500).json({ error: 'An error occurred while adding the run number' });
      }
  }
});

router.post('/runs/update/:runNumber', middlewares.restrictor, async (req, res) => {
  if (!req.session.loggedin) {
      // If user is not logged in, redirect to home page
      res.redirect('/');
  } else {
      try {
          // Find the run number to be updated by its run number
          //const runToUpdate = await RunNumber.findOne({ runNumber: req.params.runNumber });
          //const runToUpdate = await RunNumber.findByRunNumber(req.params.runNumber);

          RunNumber.updateRun(req.body.runNumber, req.body.sct, req.body.pai, req.body.date, req.body.patientName, req.body.emt, req.body.medic, req.body.unit, req.body.location, req.body.destination, req.body.notes);
          
          res.status(200).json({ message: 'Run number updated successfully', runNumber: req.body.runNumber});
      } catch (error) {
          // Handle any errors that occur during the update of the run number
          console.error('Error updating run number:', error);
          res.status(500).json({ error: 'An error occurred while updating the run number' });
      }
  }
});

router.post('/runs/delete', async (req, res) => {
  try {
      const { runNumber } = req.body;

      // Find the run number to delete
      const deletedRunNumber = await RunNumber.deleteByRunNumber(runNumber);

      if (!deletedRunNumber) {
          // If the run number is not found, send a 404 response
          return res.status(404).json({ error: 'Run number not found' });
      }

      // Send a success response indicating the run number was deleted
      res.status(200).json({ message: 'Run number deleted successfully', runNumber: deletedRunNumber });
  } catch (error) {
      // Handle any errors that occur during the deletion
      console.error('Error deleting run number:', error);
      res.status(500).json({ error: 'An error occurred while deleting the run number' });
  }
});

router.get('/runs/highestRunNumber', async (req, res) => {
  try {
    // Find the highest run number
    const highestRun = await RunNumber.findHighestRunNumber();

    if (highestRun) {
      return res.json(highestRun);
    } else {
      // If no run numbers are found, send null
      console.log('No run numbers found');
      return res.json(null);
    }
  } catch (error) {
    console.error('Error fetching highest run number:', error);
    return res.status(500).json({ error: 'Error fetching highest run number' });
  }
});

// Generate CSV content from runs
function generateCSV(runs) {
  // Create the header row
  let csvContent = 'Date, Run Number, SCT, PAI, Patient Name, EMT, Medic, Unit, Location, Destination, Notes\n';

  // Add each run as a row in the CSV content
  runs.forEach(run => {
    // Encapsulate patient name in quotes to handle comma
    const patientName = `"${run.patientName}"`;
    csvContent += `${run.date},${run.runNumber},${run.sct},${run.pai},${patientName},${run.emt},${run.medic},${run.unit},${run.location},${run.destination},${run.notes}\n`;
  });

  return csvContent;
}

// Handle Downloads
router.get('/runs/export', async (req, res) => {
  // Retrieve optional parameters from query string
  const fromDate = req.query.startDate;
  const toDate = req.query.endDate;
  const patientName = req.query.patientName;
  const medicName = req.query.medic;
  const emtName = req.query.emt;
  const unit = req.query.unit;

  // Retrieve all runs
  let runs = await RunNumber.getAll();

  // Filter runs based on query parameters
  if (fromDate && toDate) {
      // Convert fromDate and toDate to Date objects
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);

      // Filter runs by date range
      runs = runs.filter(run => {
          const runDate = new Date(run.date);
          return runDate >= startDate && runDate <= endDate;
      });
  }
  if (patientName) {
      // Filter runs by patientName
      runs = runs.filter(run => run.patientName.toLowerCase().includes(patientName.toLowerCase()));
  }
  if (medicName) {
      // Filter runs by medicName
      runs = runs.filter(run => run.medic.toLowerCase().includes(medicName.toLowerCase()));
  }
  if (emtName) {
      // Filter runs by emtName
      runs = runs.filter(run => run.emt.toLowerCase().includes(emtName.toLowerCase()));
  }
  if (unit) {
      // Filter runs by unit
      runs = runs.filter(run => run.unit.toLowerCase() === unit.toLowerCase());
  }

  // Generate CSV content
  const csvContent = generateCSV(runs);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=run_number_export.csv');
  res.send(csvContent);
});

// Define the route to fetch all runs
router.get('/runs/all', async (req, res) => {
  try {
      // Retrieve all runs
      let runs = await RunNumber.getAll();

      // Send the response with the array of all runs
      res.json({runs});
  } catch (error) {
      // Handle errors if any
      console.error('Error fetching all runs:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define a route to handle requests for viewing statistics
router.get('/statistics', async (req, res) => {
  try {
    // Get statistic values from RunNumber model.

    // Find the medic with the most runs
    const medicsWithMostRuns = await RunNumber.top5Medics();
    const emtsWithMostRuns = await RunNumber.top5Emts();
    const topUnits = await RunNumber.topUnits();
    const topDest = await RunNumber.topDestinations();
    const top5Crews = await RunNumber.top5Crews();
    const top5Employees = await RunNumber.top5Employees();

    // Render the statistics page and pass the calculated statistics
    res.render('statistics', {
      top5Employees,
      top5Crews,
      medicsWithMostRuns,
      emtsWithMostRuns,
      topUnits,
      topDest
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Error fetching statistics');
  }
});

// Define a route to handle requests for viewing statistics
router.get('/admin_statistics', async (req, res) => {
  // if admin
  if (!req.session.isAdmin) {
    res.redirect('/');
    return;
  }
  try {
    // Find the admin values
    const allDestinations = await RunNumber.getAllDestinations();
    const allLocations = await RunNumber.getAllLocations();
    const allUnits = await RunNumber.getAllUnits();
    const allEmts = await RunNumber.getAllEmts();
    const allMedics = await RunNumber.getAllMedics();

    // Render the statistics page and pass the calculated statistics
    res.render('admin_stats', {
      allDestinations,
      allLocations,
      allUnits,
      allEmts,
      allMedics
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Error fetching statistics');
  }
});

module.exports = router;
