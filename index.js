const readline = require('readline');
const crypto = require('crypto');

function sha256Hex(inputHex) {
    const inputBuffer = Buffer.from(inputHex, 'hex');
    const hash = crypto.createHash('sha256');
    hash.update(inputBuffer);
    const hexDigest = hash.digest('hex');

    return hexDigest;
}

function satoshisToBitcoin(satoshis) {
    const bitcoinValue = satoshis / 100000000;
    return bitcoinValue.toFixed(8);
}


function decodeFixedLength(hexValue) {
    const bigEndianHex = convertEndian(hexValue);
    return parseInt(bigEndianHex, 16);
}

function decodeCompactSize(hexValue) {
    const firstByte = parseInt(hexValue.substring(0, 2), 16);
    if (firstByte < 253) {
        return firstByte;
    } else if (firstByte === 253) {
        return decodeFixedLength(hexValue.substring(2, 6));
    } else if (firstByte === 254) {
        return decodeFixedLength(hexValue.substring(2, 10));
    } else if (firstByte === 255) {
        return decodeFixedLength(hexValue.substring(2, 18));
    }
}

// Function to convert little endian hex to big endian hex and vice versa
function convertEndian(hexString) {
    return hexString.match(/../g).reverse().join('');
}

// Decode a field from raw transaction data
function decodeField(startIndex, length, decodeFunction, rawTransaction) {
    const hexValue = rawTransaction.substring(startIndex, startIndex + length);
    return decodeFunction(hexValue);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter raw transaction hex: ', (rawTransaction) => {
    const hash = convertEndian(sha256Hex(sha256Hex(rawTransaction)))

    let transaction = {
        hash: hash,
        version: "",
        lockTime: "",
        vin: [],
        vout: []
    };

    let currentOffset = 0;

    const version = decodeField(currentOffset, 8, decodeFixedLength, rawTransaction);
    transaction.version = version;
    currentOffset += 8;

    const extendedMarker = decodeField(currentOffset, 2, decodeFixedLength, rawTransaction);
    currentOffset += 2;

    const extendedFlag = decodeField(currentOffset, 2, decodeFixedLength, rawTransaction);
    currentOffset += 2;

    const inputCount = decodeField(currentOffset, 2, decodeCompactSize, rawTransaction);;
    currentOffset += 2;

    for (let i = 0; i < inputCount; i++) {
        const txid = decodeField(currentOffset, 64, convertEndian, rawTransaction);
        currentOffset += 64;

        const vout = decodeField(currentOffset, 8, decodeFixedLength, rawTransaction);
        currentOffset += 8;

        const scriptSigLenHex = rawTransaction.substring(currentOffset, currentOffset + 2);
        const scriptSigLen = decodeCompactSize(scriptSigLenHex);
        currentOffset += 2;

        const scriptSig = rawTransaction.substring(currentOffset, currentOffset + scriptSigLen * 2);
        currentOffset += scriptSigLen * 2;

        const sequence = decodeField(currentOffset, 8, decodeFixedLength, rawTransaction);
        currentOffset += 8;

        const input = {
            txid: txid,
            vout: vout,
            scriptSig: scriptSig,
            txinwitness: [],
            sequence: sequence,
        };

        transaction.vin.push(input);
    }

    const outputCountHex = rawTransaction.substring(currentOffset, currentOffset + 2);
    const outputCount = decodeCompactSize(outputCountHex);
    currentOffset += 2;

    for (let i = 0; i < outputCount; i++) {
        const outputAmountHex = rawTransaction.substring(currentOffset, currentOffset + 16);
        const outputAmountBigEndian = convertEndian(outputAmountHex);

        const outputAmountSatoshi = parseInt(outputAmountBigEndian, 16);
        const outputAmountBitcoin = satoshisToBitcoin(outputAmountSatoshi);
        currentOffset += 16;

        const outputScriptLenHex = rawTransaction.substring(currentOffset, currentOffset + 2);
        const outputScriptLen = decodeCompactSize(outputScriptLenHex);
        currentOffset += 2;

        const scriptPubKeyHex = rawTransaction.substring(currentOffset, currentOffset + outputScriptLen * 2);
        currentOffset += outputScriptLen * 2;

        const output = {
            value: outputAmountBitcoin,
            n: i,
            scriptPubKey: {
                hex: scriptPubKeyHex
            }
        }

        transaction.vout.push(output)
    }

    const witnessItemsCountHex = rawTransaction.substring(currentOffset, currentOffset + 2);
    const witnessItemsCount = parseInt(witnessItemsCountHex, 16);

    currentOffset += 2;

    for (let i = 0; i < witnessItemsCount; i++) {
        const firstWitnessItemSizeHex = rawTransaction.substring(currentOffset, currentOffset + 2);
        const firstWitnessItemSize = decodeCompactSize(firstWitnessItemSizeHex, 16);
        currentOffset += 2;

        const firstWitnessItemHex = rawTransaction.substring(currentOffset, currentOffset + firstWitnessItemSize * 2);
        currentOffset += firstWitnessItemSize * 2;

        transaction.vin[i].txinwitness = firstWitnessItemHex
    }

    const lockTimeHex = rawTransaction.substring(currentOffset, currentOffset + 8);
    const lockTime = decodeFixedLength(lockTimeHex);

    transaction.lockTime = lockTime;

    console.log(JSON.stringify(transaction, null, 2));

    rl.close();
});
