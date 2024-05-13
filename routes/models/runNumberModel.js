/*
 * Copyright (c) 2024 Logan Miller
 * All rights reserved.
 *
 * This code is the property of Miller Cyber Technologies LLC.
 * Unauthorized use or distribution of this code is strictly prohibited.
 */

// Require Config
const config = require("../../config");

// Require sequelize and Initialize
const { Sequelize, DataTypes, Op } = require("sequelize");

let sequelize;

var database_table_name = "run_numbers_prod";

if (config.sql.dev) {
    database_table_name = "run_numbers_dev";
}

try {
  sequelize = new Sequelize(
    config.sql.database,
    config.sql.user,
    config.sql.password,
    {
      host: config.sql.host,
      dialect: "mysql",
    }
  );
  console.log("DATABASE: Connected to MySQL database.");
  console.log("DATABASE: Database Table Selected -> " + database_table_name);
  //console.log(RunNumber.getTotalRuns() + " records found.");
} catch (error) {
  console.error("DATABASE: Error connecting to MySQL database:", error);
}

// Define run number model
const RunNumber = sequelize.define('runNumber', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    runNumber: {
        type: Sequelize.STRING
    },
    sct: {
        type: Sequelize.STRING
    },
    pai: {
        type: Sequelize.STRING
    },
    date: {
        type: Sequelize.STRING
    },
    patientName: {
        type: Sequelize.STRING
    },
    emt: {
        type: Sequelize.STRING
    },
    medic: {
        type: Sequelize.STRING
    },
    unit: {
        type: Sequelize.STRING
    },
    location: {
        type: Sequelize.STRING
    },
    destination: {
        type: Sequelize.STRING
    },
    notes: {
        type: Sequelize.STRING
    },
    },
    {
        tableName: database_table_name,
    }
);

// Log amount of records.
RunNumber.count()
    .then((count) => console.log("DATABASE: " + count + " records found."))
    .catch((error) => console.error("DATABASE: Error logging total runs count:", error));

RunNumber.findHighestRunNumber = async function () {
    try {
        const highestRun = await RunNumber.findOne({
            attributes: [
                [sequelize.fn('LEFT', sequelize.col('runNumber'), 9), 'runNumber']
            ],
            order: [['runNumber', 'DESC']]
        });
        console.log('DATABASE: Highest run number:', highestRun.runNumber)
        return highestRun;
    } catch (error) {
        console.error('DATABASE: Error fetching highest run number:', error);
        throw error;
    }
};

// Update run number
RunNumber.updateRun = async function (
    runNumber,
    sct,
    pai,
    date,
    patientName,
    emt,
    medic,
    unit,
    location,
    destination,
    notes
) {
    try {
        const updatedRun = await RunNumber.update(
            {
                runNumber: runNumber,
                patientName: patientName,
                sct: sct,
                pai: pai,
                date: date,
                emt: emt,
                medic: medic,
                unit: unit,
                location: location,
                destination: destination,
                notes: notes
            },
            {
                where: {
                    runNumber: runNumber
                }
            }
        );
    }catch(error){
        console.error('DATABASE: Error updating run number:', error);
    }
};

// Function to generate the next run number
RunNumber.getNextRunNumber = async function () {
    try {
        const currentYear = new Date().getFullYear().toString().slice(-2); // Get the current year's last two digits
        const latestRun = await RunNumberModel.findOne({
            where: {
                runNumber: {
                    [Sequelize.Op.like]: `FR${currentYear}%` // Find the latest run number for the current year
                }
            },
            order: [['runNumber', 'DESC']] // Order by run number in descending order to get the latest one
        });
        
        // Log the latest run number
        console.log('DATABASE: Latest run number:', latestRun);

        let nextRunNumber;
        if (latestRun) {
            const latestRunNumber = latestRun.runNumber.slice(-5); // Extract the last 5 digits of the latest run number
            const nextRunNumberInt = parseInt(latestRunNumber) + 1; // Increment the last 5 digits
            const paddedNextRunNumber = nextRunNumberInt.toString().padStart(5, '0'); // Pad the next run number with zeros if necessary
            nextRunNumber = `FR${currentYear}${paddedNextRunNumber}`; // Construct the next run number
        } else {
            // If there are no previous runs for the current year, start with FRYY00001
            nextRunNumber = `FR${currentYear}00001`;
        }

        // Log the next run number
        console.log('DATABASE: Next run number:', nextRunNumber);

        return nextRunNumber;
    } catch (error) {
        console.error('DATABASE: Error generating next run number:', error);
        throw error;
    }
}

// Find run by runNumber
RunNumber.findByRunNumber = async function (runNumber) {
    try {
        const run = await RunNumber.findOne({
            where: {
                runNumber: runNumber
            }
        });
        return run;
    }catch(error){
        console.error('DATABASE: Error fetching run number by run number:', error);
        throw error;
    }
};

// Find run by id
RunNumber.findById = async function (id) {
    try {
        const run = await RunNumber.findOne({
            where: {
                id: id
            }
        });
        return run;
    }catch(error){
        console.error('DATABASE: Error fetching run number by id:', error);
        throw error;
    }
};

// Delete run by id
RunNumber.deleteById = async function (id) {
    try {
        const run = await RunNumber.destroy({
            where: {
                id: id
            }
        });
        return run;
    }catch(error){
        console.error('DATABASE: Error deleting run number by id:', error);
        throw error;
    }
};

// Delete run by run number
RunNumber.deleteByRunNumber = async function (runNumber) {
    try {
        const run = await RunNumber.destroy({
            where: {
                runNumber: runNumber
            }
        });
        return run;
    }catch(error){
        console.error('DATABASE: Error deleting run number by run number:', error);
        throw error;
    }
};

// Get all run numbers
RunNumber.getAll = async function () {
    try {
        const runs = await RunNumber.findAll(); // Use Sequelize's findAll method
        return runs;
    } catch (error) {
        console.error('DATABASE: Error fetching run numbers:', error);
        throw error; // Rethrow the error to handle it in the calling code
    }
};

// Create run number
RunNumber.createRun = async function (
    id,
    runNumber,
    sct,
    pai,
    date,
    patientName,
    emt,
    medic,
    unit,
    location,
    destination,
    notes
) {
    return await RunNumber.create({
        id: id,
        runNumber: runNumber,
        sct: sct,
        pai: pai,
        date: date,
        patientName: patientName,
        emt: emt,
        medic: medic,
        unit: unit,
        location: location,
        destination: destination,
        notes: notes
    });
};

// Check if run number exists
RunNumber.exists = async function (runNumber) {
    return await RunNumber.findOne({
        where: {
            runNumber: runNumber
        }
    });
};

// Find the top 6 emts and medics with most runs. We want to combine the run count from the EMT and Medic columns if the name is the same.
RunNumber.top5Crews = async function(){
    try {
        const topEmtsAndMedics = await RunNumber.findAll({
            attributes: ['emt', 'medic', [sequelize.fn('COUNT', sequelize.col('emt')), 'runCount']],
            group: ['emt', 'medic'],
            order: [[sequelize.fn('COUNT', sequelize.col('emt')), 'DESC']],
            limit: 5
        });
        return topEmtsAndMedics;
    }catch(error){
        console.error('DATABASE: Error fetching top 6 emts and medics:', error);
        throw error;
    }
}

// Find the top 5 medics with most runs from the 'medic' column
RunNumber.top5Medics = async function(){
    try {
        const topMedics = await RunNumber.findAll({
            attributes: ['medic', [sequelize.fn('COUNT', sequelize.col('medic')), 'runCount']],
            group: ['medic'],
            order: [[sequelize.fn('COUNT', sequelize.col('medic')), 'DESC']],
            limit: 5
        });
        return topMedics;
    } catch (error) {
        console.error('DATABASE: Error fetching top 5 medics:', error);
        throw error;
    }
}

// Find the top 5 emts with most runs from the emt column
RunNumber.top5Emts = async function(){
    try {
        const topEmts = await RunNumber.findAll({
            attributes: ['emt', [sequelize.fn('COUNT', sequelize.col('emt')), 'runCount']],
            group: ['emt'],
            order: [[sequelize.fn('COUNT', sequelize.col('emt')), 'DESC']],
            limit: 5
        });
        return topEmts;
    } catch (error) {
        console.error('DATABASE: Error fetching top 5 emts:', error);
        throw error;
    }
}

RunNumber.top5Employees = async function(){
    try {
        // Query for medics
        const topMedics = await RunNumber.findAll({
            attributes: ['medic', [Sequelize.fn('COUNT', Sequelize.col('medic')), 'runCount']],
            group: ['medic']
        });

        // Query for EMTs
        const topEmts = await RunNumber.findAll({
            attributes: ['emt', [Sequelize.fn('COUNT', Sequelize.col('emt')), 'runCount']],
            group: ['emt']
        });

        // Merge the results and calculate total run count for each employee
        const mergedResults = {};
        
        // Process results for medics
        topMedics.forEach(medic => {
            mergedResults[medic.medic] = (mergedResults[medic.medic] || 0) + parseInt(medic.getDataValue('runCount') || 0);
        });

        // Process results for EMTs
        topEmts.forEach(emt => {
            mergedResults[emt.emt] = (mergedResults[emt.emt] || 0) + parseInt(emt.getDataValue('runCount') || 0);
        });

        // Convert mergedResults to an array of objects
        const topEmployees = Object.keys(mergedResults).map(name => ({
            name,
            runCount: mergedResults[name]
        }));

        // Sort the top employees by run count in descending order and get the top 5
        const sortedTopEmployees = topEmployees.sort((a, b) => b.runCount - a.runCount).slice(0, 10);

        return sortedTopEmployees;
    } catch (error) {
        console.error('DATABASE: Error fetching top 5 employees:', error);
        throw error;
    }
}

// Find top 5 units with most runs from the unit column
RunNumber.topUnits = async function(){
    try {
        const topUnits = await RunNumber.findAll({
            attributes: ['unit', [sequelize.fn('COUNT', sequelize.col('unit')), 'runCount']],
            group: ['unit'],
            order: [[sequelize.fn('COUNT', sequelize.col('unit')), 'DESC']],
            limit: 5
        });
        return topUnits;
    } catch (error) {
        console.error('DATABASE: Error fetching top 3 units:', error);
        throw error;
    }
}

// Find top 3 destinations from the destination column
RunNumber.topDestinations = async function(){
    try {
        const topDest = await RunNumber.findAll({
            attributes: ['destination', [sequelize.fn('COUNT', sequelize.col('destination')), 'runCount']],
            group: ['destination'],
            order: [[sequelize.fn('COUNT', sequelize.col('destination')), 'DESC']],
            limit: 5
        });
        return topDest;
    }catch (error){
        console.error('DATABASE: Error fetching top 3 destinations:', error);
        throw error;
    }
}

// Return all destinations
RunNumber.getAllDestinations = async function(){
    try {
        const destinations = await RunNumber.findAll({
            attributes: ['destination', [sequelize.fn('COUNT', sequelize.col('destination')), 'count']],
            group: ['destination'],
            order: [[sequelize.fn('COUNT', sequelize.col('destination')), 'DESC']]
        });
        return destinations;
    } catch(error){
        console.error('DATABASE: Error fetching all destinations with counts:', error);
        throw error;
    }
}

// Return all locations
RunNumber.getAllLocations = async function(){
    try {
        const locations = await RunNumber.findAll({
            attributes: ['location', [sequelize.fn('COUNT', sequelize.col('location')), 'count']],
            group: ['location'],
            order: [[sequelize.fn('COUNT', sequelize.col('location')), 'DESC']]
        });
        return locations;
    }catch(error){
        console.error('DATABASE: Error fetching all locations:', error);
        throw error;
    }
}

// Return all units
RunNumber.getAllUnits = async function(){
    try {
        const units = await RunNumber.findAll({
            attributes: ['unit', [sequelize.fn('COUNT', sequelize.col('unit')), 'runCount']],
            group: ['unit'],
            order: [[sequelize.fn('COUNT', sequelize.col('unit')), 'DESC']]
        });
        return units;
    }catch(error){
        console.error('DATABASE: Error fetching all units:', error);
        throw error;
    }
}

// Return all emts and their run count
RunNumber.getAllEmts = async function(){
    try {
        const emts = await RunNumber.findAll({
            attributes: ['emt', [sequelize.fn('COUNT', sequelize.col('emt')), 'runCount']],
            group: ['emt'],
            order: [[sequelize.fn('COUNT', sequelize.col('emt')), 'DESC']]
        });
        return emts;
    }catch(error){
        console.error('DATABASE: Error fetching all emts:', error);
        throw error;
    }
}

// Return all medics and their run count
RunNumber.getAllMedics = async function(){
    try {
        const medics = await RunNumber.findAll({
            attributes: ['medic', [sequelize.fn('COUNT', sequelize.col('medic')), 'runCount']],
            group: ['medic'],
            order: [[sequelize.fn('COUNT', sequelize.col('medic')), 'DESC']]
        });
        return medics;
    }catch(error){
        console.error('DATABASE: Error fetching all medics:', error);
        throw error;
    }
}

module.exports = RunNumber;