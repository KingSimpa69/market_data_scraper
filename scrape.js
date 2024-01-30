const mongoose = require('mongoose');
const ethers = require('ethers');
const { mongoURI, chain, registryContract, statCallContract } = require('./settings.json');
const Volume = require('./dbModel');
const ABI = require('./ABI.json');
const provider = require('./provider');

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to DB');
    } catch (error) {
        console.error('Error connecting DB:', error);
    }
};

const saveVolumeData = async (marketId, volume, floor) => {
    try {
        const newMarketData = new Volume({
            marketId: marketId,
            volume: volume,
            floor: floor
        });
        await newMarketData.save();
        console.log(`ID: ${marketId} saved`);
    } catch (error) {
        console.error('Error saving volume data:', error);
    }
};

const getDataForMarket = async (marketContract) => {
    const statCall = new ethers.Contract(statCallContract[chain], ABI.statcall, provider);
    const floor = await statCall.getFloorPrice(marketContract);
    const volume = await statCall.getVolume(marketContract);
    return ({
        volume: parseInt(volume),
        floor: parseInt(floor)
    });
};

const fetchAndSaveVolumeData = async () => {
    const registry = new ethers.Contract(registryContract[chain], ABI.registry, provider);
    const totalMarkets = await registry.totalMarkets();
    const batchSize = 3;

    for (let start = 1; start <= parseInt(totalMarkets); start += batchSize) {
        const end = Math.min(start + batchSize - 1, parseInt(totalMarkets));

        const volumePromises = [];
        const floorPromises = [];

        for (let marketId = start; marketId <= end; marketId++) {
            const marketContract = await registry.marketData(marketId);
            const data = await getDataForMarket(marketContract[1]); // Await here
            volumePromises.push(data.volume);
            floorPromises.push(data.floor);
        }
        const volumes = await Promise.all(volumePromises);
        const floors = await Promise.all(floorPromises);

        for (let i = 0; i < volumes.length; i++) {
            const marketId = start + i;
            await saveVolumeData(marketId, volumes[i], floors[i]);
        }
    }
};

const main = async () => {
    try {
        await connectToMongoDB();
        await fetchAndSaveVolumeData();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

main();
