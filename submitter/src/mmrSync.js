const log4js = require('log4js');

// Configurations
const config = require('../config.js');
const logConfig = require('../log-config.json');
log4js.configure(logConfig);

// Services
const Scheduler = require('./services/Scheduler.js');
const MMRController = require('./lib/mmr/MMRController.js');
const RskMMR = require('./services/rsk/RskMMR.js');

const logger = log4js.getLogger('main');
logger.info('RSK Host', config.rsk.host);
logger.info('ETH Host', config.eth.host);

const mmrController = new MMRController(config, log4js.getLogger('MMR-CONTROLLER'));
const rskMMR = new RskMMR(config, log4js.getLogger('RSK-MMR'), mmrController);

let pollingInterval = config.mmrSyncInterval * 1000 * 60; // Minutes
let scheduler = new Scheduler(pollingInterval, logger, { run: () =>  run() });

scheduler.start().catch((err) => {
    logger.error('Unhandled Error on mmrSync start(): ', err);
});

async function run() {
    try {
        await rskMMR.run();
    } catch(err) {
        logger.error('Unhandled Error on mmrSync run(): ', err);
        process.exit();
    }
}

async function exitHandler() {
    await rskMMR.exitHandler();
    process.exit();
}

// catches ctrl+c event
process.on('SIGINT', exitHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);


// export so we can test it
module.exports = { scheduler };
