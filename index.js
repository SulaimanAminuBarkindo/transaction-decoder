// Raw transaction string
const rawTransaction = "020000000001010ccc140e766b5dbc884ea2d780c5e91e4eb77597ae64288a42575228b79e234900000000000000000002bd37060000000000225120245091249f4f29d30820e5f36e1e5d477dc3386144220bd6f35839e94de4b9cae81c00000000000016001416d31d7632aa17b3b316b813c0a3177f5b6150200140838a1f0f1ee607b54abf0a3f55792f6f8d09c3eb7a9fa46cd4976f2137ca2e3f4a901e314e1b827c3332d7e1865ffe1d7ff5f5d7576a9000f354487a09de44cd00000000";

// Function to decode fixed-length fields to an integer
function decodeFixedLength(hexValue) {
  // Convert little-endian to big-endian using the existing function
  const bigEndianHex = littleEndianToBigEndian(hexValue);
  // Parse the big-endian hex value
  return parseInt(bigEndianHex, 16);
}

// Function to decode CompactSize fields
function decodeCompactSize(hexValue) {
  const firstByte = parseInt(hexValue.substring(0, 2), 16);
  if (firstByte < 253) {
      return firstByte;
  } else if (firstByte === 253) {
      // 2 bytes
      return decodeFixedLength(hexValue.substring(2, 6));
  } else if (firstByte === 254) {
      // 4 bytes
      return decodeFixedLength(hexValue.substring(2, 10));
  } else if (firstByte === 255) {
      // 8 bytes
      return decodeFixedLength(hexValue.substring(2, 18));
  }
}

// Function to convert little endian hex to big endian hex
function littleEndianToBigEndian(hexString) {
  return hexString.match(/../g).reverse().join('');
}


// Decode a field from raw transaction data
function decodeField(startIndex, length, decodeFunction) {
  const hexValue = rawTransaction.substring(startIndex, startIndex + length);
  return decodeFunction(hexValue);
}

let currentOffset = 0;

// Decode version number which is first 4 bytes of transaction hex (8 hex characters)
const version = decodeField(currentOffset, 8, decodeFixedLength);
console.log(`version: ${version}`);

currentOffset += 8;

// Decode extended marker which is next 1 byte (2 hex characters)
const extendedMarker = decodeField(currentOffset, 2, decodeFixedLength);
console.log(`extended marker: ${extendedMarker}`);

currentOffset += 2;

// Decode extended flag which is next 1 byte (2 hex characters)
const extendedFlag = decodeField(currentOffset, 2, decodeFixedLength);
console.log(`extended flag: ${extendedFlag}`);

currentOffset += 2;

// Decode count of inputs in transaction which is next 1 bytes (2 hex characters)
const inputCount = decodeField(currentOffset, 2, decodeCompactSize);
console.log(`input count: ${inputCount}`);

currentOffset += 2;

  for (let i = 0; i < inputCount; i++) {
    // Parse txid source
    const txidSource = decodeField(currentOffset, 64, littleEndianToBigEndian);
    console.log(`txid source (big endian): ${txidSource}`);

    currentOffset += 64;

    // Parse vout
    const vout = decodeField(currentOffset, 8, decodeFixedLength);
    console.log(`vout: ${vout}`);

    currentOffset += 8;

    // Parse scriptSig length
    const scriptSigLenHex = rawTransaction.substring(currentOffset, currentOffset + 2);
    const scriptSigLen = decodeCompactSize(scriptSigLenHex);
    console.log(`scriptSig length: ${scriptSigLen}`);

    currentOffset += 2;

    // Parse scriptSig
    const scriptSig = rawTransaction.substring(currentOffset, currentOffset + scriptSigLen * 2);
    console.log(`scriptSig: ${scriptSig}`);

    currentOffset += scriptSigLen * 2;
    
    // Parse sequence
    const sequence = decodeField(currentOffset, 8, decodeFixedLength);
    console.log(`sequence: ${sequence}`);

    currentOffset += 8;
  }


// Decode output count
const outputCountHex = rawTransaction.substring(currentOffset, currentOffset + 2);
const outputCount = decodeCompactSize(outputCountHex);
console.log(`output count: ${outputCount}`);

currentOffset += 2;

for (let i = 0; i < outputCount; i++) {
  const outputAmountHex = rawTransaction.substring(currentOffset, currentOffset + 16);
  // Reverse the order of the hex characters to convert from little-endian to big-endian
  const outputAmountBigEndian = littleEndianToBigEndian(outputAmountHex);

  // Convert the big-endian hex string to an integer
  const outputAmountSatoshi = BigInt(`0x${outputAmountBigEndian}`);

  console.log(`Output amount in satoshi: ${outputAmountSatoshi}`);

  currentOffset += 16;

  // Parse script length of the output script
  const outputScriptLenHex = rawTransaction.substring(currentOffset, currentOffset + 2);

  const outputScriptLen = decodeCompactSize(outputScriptLenHex);
  console.log(`Output script length: ${outputScriptLen}`);

  currentOffset += 2;

  // Extract the locking script (scriptPubKey)
  const lockingScript = rawTransaction.substring(currentOffset, currentOffset + outputScriptLen * 2);
  console.log(`Locking Script (scriptPubKey): ${lockingScript}`);

  currentOffset += outputScriptLen * 2;
}

const witnessProgramItemCountHex = rawTransaction.substring(currentOffset, currentOffset + 2);
console.log(`witnessProgramItemCountHex: ${witnessProgramItemCountHex}`);

// Decode the second locking script length
const witnessProgramItemsCount = parseInt(witnessProgramItemCountHex, 16);
console.log(`witnessProgramItemsCount: ${witnessProgramItemsCount}`);

currentOffset += 2;

for (let i = 0; i < witnessProgramItemsCount; i++) {
  
  const firstWitnessProgramItemSizeHex = rawTransaction.substring(currentOffset, currentOffset + 2);
  console.log(`firstWitnessProgramItemSizeHex: ${firstWitnessProgramItemSizeHex}`);

  // Decode the second locking script length
  const firstWitnessProgramItemSize = decodeCompactSize(firstWitnessProgramItemSizeHex, 16);
  console.log(`firstWitnessProgramItemSize: ${firstWitnessProgramItemSize}`);

  const firstWitnessItemHex = rawTransaction.substring(currentOffset, currentOffset + firstWitnessProgramItemSize * 2);
  console.log(`firstWitnessItemHex: ${firstWitnessItemHex}`);

  // Decode the second locking script length
  console.log(`firstWitnessItem: ${firstWitnessItemHex}`);

  currentOffset += firstWitnessProgramItemSize * 2;
}

const nLockTimeHex = rawTransaction.substring(currentOffset, currentOffset + 8);
console.log(`nLockTimeHex: ${nLockTimeHex}`);

const nLockTime = decodeFixedLength(nLockTimeHex);
console.log(`nLockTime: ${nLockTime}`);
