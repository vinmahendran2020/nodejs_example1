const log4js = require('log4js');
const logger = log4js.getLogger("BlockchainConnection");
// log4js.configure({
//   appenders: { BlockchainConnection: { type: 'file', filename: 'BlockchainConnection.log' } },
//   categories: { default: { appenders: ['BlockchainConnection'], level: 'debug' } }
// });
logger.level = process.env.LOG || 'debug';

function Trace(message) {
    logger.trace(message);
  }
   
  function Debug(message) {
    logger.debug(message);
  }
   
  function Info(message) {
    logger.info(message);
  }
   
  function Warn(message) {
    logger.warn(message);
  }
   
  function Err(message) {
    logger.error(message);
  }
   
  function Fatal(message) {
    logger.fatal(message);
  }
   
  function TraceHeadder(method, params, file) {
    try {
    const obj = {};
    for (let i = 0; i < params.length; i++) {
      if(params[i] && typeof params[i] == Object){
        obj[i] = JSON.stringify(params[i]).substring(0, 100);
      }    
    }
    
    if (file !== undefined) {
      logger.trace(`[[ENTERING ${method} ${file} WITH PARAMS ${JSON.stringify(obj)}]]`);
    } else {
      logger.trace(`[[ENTERING ${method} WITH PARAMS ${JSON.stringify(obj)}]]`);
    }
    } catch (e) {
      logger.error(`ERROR LOGGING: ${e}`);
    }
  }
   
  module.exports = {
    Trace,
    Debug,
    Info,
    Warn,
    Err,
    Fatal,
    TraceHeadder,
  };
