// Raw transaction string
const rawTransaction = "020000000001010ccc140e766b5dbc884ea2d780c5e91e4eb77597ae64288a42575228b79e234900000000000000000002bd37060000000000225120245091249f4f29d30820e5f36e1e5d477dc3386144220bd6f35839e94de4b9cae81c00000000000016001416d31d7632aa17b3b316b813c0a3177f5b6150200140838a1f0f1ee607b54abf0a3f55792f6f8d09c3eb7a9fa46cd4976f2137ca2e3f4a901e314e1b827c3332d7e1865ffe1d7ff5f5d7576a9000f354487a09de44cd00000000";

// Function to decode fixed-length fields to an integer
function decodeFixedLength(hexValue) {
    return parseInt(hexValue.match(/../g).reverse().join(''), 16);
}

// Function to decode CompactSize fields
function decodeCompactSize(hexValue) {
    const firstByte = parseInt(hexValue.substring(0, 2), 16);
    if (firstByte < 253) {
        return firstByte;
    } else if (firstByte === 253) {
        // 2 bytes
        return parseInt(hexValue.substring(2, 6).match(/../g).reverse().join(''), 16);
    } else if (firstByte === 254) {
        // 4 bytes
        return parseInt(hexValue.substring(2, 10).match(/../g).reverse().join(''), 16);
    } else if (firstByte === 255) {
        // 8 bytes
        return parseInt(hexValue.substring(2, 18).match(/../g).reverse().join(''), 16);
    }
}

// Function to convert little endian hex to big endian hex
function littleEndianToBigEndian(hexString) {
    return hexString.match(/../g).reverse().join('');
}

// Decode version number
const versionHex = rawTransaction.substring(0, 8);
const version = decodeFixedLength(versionHex);  
console.log(`version: ${version}`);

// Decode extended marker and flag
const extendedMarkerHex = rawTransaction.substring(8, 10);
const extendedMarker = decodeFixedLength(extendedMarkerHex);  
console.log(`extended marker: ${extendedMarker}`);

const extendedFlagHex = rawTransaction.substring(10, 12);
const extendedFlag = decodeFixedLength(extendedFlagHex);  
console.log(`extended flag: ${extendedFlag}`);

// Decode input count
const inputCountHex = rawTransaction.substring(12, 14);
const inputCount = decodeCompactSize(inputCountHex);  
console.log(`input count: ${inputCount}`);

// Parse txid source
const txidSourceHex = rawTransaction.substring(14, 14 + 2 * 32);
const txidSourceLittleEndian = littleEndianToBigEndian(txidSourceHex);
console.log(`txid source (big endian): ${txidSourceLittleEndian}`);

// Decode vout
const voutHex = rawTransaction.substring(14 + 2 * 32, 14 + 2 * 32 + 8);
const voutLittleEndian = littleEndianToBigEndian(voutHex);
const vout = parseInt(voutLittleEndian, 16);
console.log(`vout: ${vout}`);

// Decode scriptSig length
const scriptSigLenHex = rawTransaction.substring(14 + 2 * 32 + 8, 14 + 2 * 32 + 8 + 2);
let scriptSigLen;
if (parseInt(scriptSigLenHex, 16) < 253) {
    scriptSigLen = parseInt(scriptSigLenHex, 16);
} else {
    const byteCount = parseInt(rawTransaction.substring(14 + 2 * 32 + 8 + 2, 14 + 2 * 32 + 8 + 2 + 2), 16);
    scriptSigLen = parseInt(rawTransaction.substring(14 + 2 * 32 + 8 + 2 + 2, 14 + 2 * 32 + 8 + 2 + 2 + 2 * byteCount), 16);
}
console.log(`scriptSig length: ${scriptSigLen}`);

// Parse scriptSig
const scriptSigHex = rawTransaction.substring(14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen, 14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen);
console.log(`scriptSig: ${scriptSigHex}`);

// Decode nSequence
const nSequenceHex = rawTransaction.substring(14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen, 14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8);
const nSequenceLittleEndian = littleEndianToBigEndian(nSequenceHex);
const nSequence = parseInt(nSequenceLittleEndian, 16);
console.log(`nSequence: ${nSequence}`);

// Decode output count
const outputCountHex = rawTransaction.substring(14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8, 14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2);
const outputCount = decodeCompactSize(outputCountHex);
console.log(`output count: ${outputCount}`);

const outputAmountHex = rawTransaction.substring(
  14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2,  // Start index
  14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 // End index
);

// Reverse the order of the hex characters to convert from little-endian to big-endian
const outputAmountBigEndian = outputAmountHex.match(/../g).reverse().join('');

// Convert the big-endian hex string to an integer
const outputAmountSatoshi = BigInt(`0x${outputAmountBigEndian}`);

console.log(`Output amount in satoshi: ${outputAmountSatoshi}`);

// Parse script length of the output script
const outputScriptLenHex = rawTransaction.substring(
  14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16, // Start index
  14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2 // End index
);

let outputScriptLen;
if (parseInt(outputScriptLenHex, 16) < 253) {
  outputScriptLen = parseInt(outputScriptLenHex, 16);
} else {
  const byteCount = parseInt(rawTransaction.substring(
      14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2, // Start index
      14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2 + 2 // End index
  ), 16);
  outputScriptLen = parseInt(rawTransaction.substring(
      14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2 + 2, // Start index
      14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2 + 2 + 2 * byteCount // End index
  ), 16);
}

console.log(`Output script length: ${outputScriptLen}`);

// Extract the locking script (scriptPubKey)
// Extract the locking script (scriptPubKey)
const lockingScript = rawTransaction.substring(
  14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2, // Start index
  14 + 2 * 32 + 8 + 2 + 2 * scriptSigLen + 2 * scriptSigLen + 8 + 2 + 16 + 2 + outputScriptLen * 2 // End index
);

console.log(`Locking Script (scriptPubKey): ${lockingScript}`);

