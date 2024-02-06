var bitcoin = require('bitcoinjs-lib');

// Check if command line argument is provided
if (process.argv.length <= 2) {
  console.log("Usage: node index.js <rawtx_hex>");
  process.exit(1);
}

// Get raw transaction hex from command line argument
var rawtx = process.argv[2];

// Parse raw transaction hex
var tx = bitcoin.Transaction.fromHex(rawtx);

// Get transaction version
var version = tx.version;

// Get transaction inputs
var inputs = tx.ins.map(input => {
  return {
    hash: input.hash.reverse().toString('hex'),
    index: input.index,
    script: input.script.toString('hex'),
    sequence: input.sequence,
    witness: input.witness.map(wit => wit.toString('hex')), // Add this line to get witness data
  };
});

// Get transaction outputs
var outputs = tx.outs.map(output => {
  var outputScript = bitcoin.script.toASM(bitcoin.script.decompile(output.script));

  try {
    // Decode the output script
    var decodedOutputScript = bitcoin.script.fromASM(outputScript);
    var decodedOutput = bitcoin.address.fromOutputScript(decodedOutputScript, bitcoin.networks.testnet);

    return {
      script: output.script.toString('hex'),
      asm: outputScript,
      desc: decodedOutput,
      type: decodedOutput.type,
      p2sh: decodedOutput.p2sh,
    };
  } catch (error) {
    // Handle non-standard scripts
    return {
      script: output.script.toString('hex'),
      asm: outputScript,
      desc: 'Non-standard script',
    };
  }
});

// Get transaction locktime
var locktime = tx.locktime;

// Print transaction details
console.log("Transaction Version:", version);
console.log("Transaction Inputs:", inputs);
console.log("Transaction Outputs:", outputs);
console.log("Transaction Locktime:", locktime);

// Display witness data
inputs.forEach((input, index) => {
  if (input.witness.length > 0) {
    console.log(`Witness Data for Input ${index}:`, input.witness);
  }
});
