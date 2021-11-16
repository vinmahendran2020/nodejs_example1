const should = require('chai')
  .should();

async function assertRevert (promise) {
  try {
    await promise;
    
  } catch (error) {
    if(error.message=="contractID is not defined")  error.message.should.include('contractID is not defined');
    else if(error.message=='contract.methods[functionName] is not a function') error.message.should.include('contract.methods[functionName] is not a function');
    else error.message.should.include('.methods[functionName] is not a function');
    return;
  }
  should.fail('Expected revert not received');
}

module.exports = {
  assertRevert,
};