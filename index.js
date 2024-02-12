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
    return [parseInt(bigEndianHex, 16), hexValue.length];
}

function decodeCompactSize(hexValue) {
    const firstByte = parseInt(hexValue.substring(0, 2), 16);
    let hexToSkip = 2;

    if (firstByte < 253) {
        return [firstByte, hexToSkip];
    } else if (firstByte === 253) {
        hexToSkip = 4;
        const [decodedValue, hexToSkipFixed] = decodeFixedLength(hexValue.substring(2, 6))
        return [decodedValue, hexToSkip];
    } else if (firstByte === 254) {
        hexToSkip = 8;
        const [decodedValue, hexToSkipFixed] = decodeFixedLength(hexValue.substring(2, 10))
        return [decodedValue, hexToSkip];
    } else if (firstByte === 255) {
        hexToSkip = 16;
        const [decodedValue, hexToSkipFixed] = decodeFixedLength(hexValue.substring(2, 18))
        return [decodedValue, hexToSkip];
    }
}

function decodeField(startIndex, length, decodeFunction, rawTransaction) {
    const hexValue = rawTransaction.substring(startIndex, startIndex + length);
    const [decodedValue, hexToSkip] = decodeFunction(hexValue);
    return [decodedValue, hexToSkip];
}

// Function to convert little endian hex to big endian hex and vice versa
function convertEndian(hexString) {
    const convertedHex = hexString.match(/../g).reverse().join('');
    return [convertedHex, hexString.length]
}

function isSegWitTransaction(rawTransaction) {
    if (rawTransaction.length < 10) {
        throw new Error("Raw transaction is too short");
    }

    const version = parseInt(rawTransaction.substring(0, 8), 16);
    if (version < 2) {
        return false;
    }

    // Check if the byte after version is 0 and the next byte is 1
    const marker = parseInt(rawTransaction.substring(8, 10), 16);
    const flag = parseInt(rawTransaction.substring(10, 12), 16);
    return marker === 0 && flag === 1;
}

function getVersion(rawTransaction) {
    const [version, hexToSkip] = decodeField(0, 8, decodeFixedLength, rawTransaction);
    return [version, hexToSkip];
}

function getInputCount(rawTransaction, isSegWit) {
    let [, nextOffset] = getVersion(rawTransaction);

    // skip marker and flag (2 bytes or 4 hex) if it is segwit transaction
    nextOffset = isSegWit ? nextOffset + 4 : nextOffset;
    const [inputCount, hexToSkip] = decodeField(nextOffset, 2, decodeCompactSize, rawTransaction);

    return [inputCount, nextOffset + hexToSkip];
}

function getInputs(rawTransaction, isSegWit) {
    let inputs = [];
    let [inputCount, nextOffset] = getInputCount(rawTransaction, isSegWit);

    currentOffset = nextOffset
    for (let i = 0; i < inputCount; i++) {
        const [txid, hexToSkip] = decodeField(currentOffset, 64, convertEndian, rawTransaction);
        currentOffset += hexToSkip;

        const [vout, hexToSkip1] = decodeField(currentOffset, 8, decodeFixedLength, rawTransaction);
        currentOffset += hexToSkip1;

        const scriptSigLenHex = rawTransaction.substring(currentOffset, currentOffset + 2);
        const [scriptSigLen, hexToSkip2] = decodeCompactSize(scriptSigLenHex);
        currentOffset += hexToSkip2;

        const scriptSig = rawTransaction.substring(currentOffset, currentOffset + scriptSigLen * 2);
        currentOffset += scriptSigLen * 2;

        const [sequence, hexToSkip3] = decodeField(currentOffset, 8, decodeFixedLength, rawTransaction);
        currentOffset += hexToSkip3;

        const input = {
            txid: txid,
            vout: vout,
            scriptSig: scriptSig,
            txinwitness: [],
            sequence: sequence,
        };

        inputs.push(input);
    }

    return [inputs, currentOffset];
}

function getOutputCount(rawTransaction, isSegWit) {
    const [, nextOffset] = getInputs(rawTransaction, isSegWit);

    const [inputCount, hexToSkip] = decodeField(nextOffset, 2, decodeCompactSize, rawTransaction);

    return [inputCount, nextOffset + hexToSkip];
}

function getOutputs(rawTransaction, isSegWit) {
    let outputs = [];
    const [outputCount, nextOffset] = getOutputCount(rawTransaction, isSegWit);
    currentOffset = nextOffset;

    for (let i = 0; i < outputCount; i++) {
        const outputAmountHex = rawTransaction.substring(currentOffset, currentOffset + 16);
        const outputAmountBigEndian = convertEndian(outputAmountHex);

        const outputAmountSatoshi = parseInt(outputAmountBigEndian, 16);
        const outputAmountBitcoin = satoshisToBitcoin(outputAmountSatoshi);
        currentOffset += 16;

        const outputScriptLenHex = rawTransaction.substring(currentOffset, currentOffset + 2);
        const [outputScriptLen, hexToSkip] = decodeCompactSize(outputScriptLenHex);
        currentOffset += hexToSkip;

        const scriptPubKeyHex = rawTransaction.substring(currentOffset, currentOffset + outputScriptLen * 2);
        currentOffset += outputScriptLen * 2;

        const output = {
            value: outputAmountBitcoin,
            n: i,
            scriptPubKey: {
                hex: scriptPubKeyHex
            }
        };

        outputs.push(output);
    }

    return [outputs, currentOffset];
}

function getWitnessItems(rawTransaction) {
    const isSegWit = true;
    const [inputCount, _] = getInputCount(rawTransaction, isSegWit);
    const [, nextOffset] = getOutputs(rawTransaction, isSegWit);
    let currentOffset = nextOffset;

    const witnessItemsForAllInputs = [];
    for (let i = 0; i < inputCount; i++) {
        const witnessItemsCountHex = rawTransaction.substring(currentOffset, currentOffset + 2);
        const witnessItemsCount = parseInt(witnessItemsCountHex, 16);
        currentOffset += 2;

        const witnessItemsForOneInput = [];
        for (let j = 0; j < witnessItemsCount; j++) {
            const WitnessItemSizeHex = rawTransaction.substring(currentOffset, currentOffset + 2);
            const [WitnessItemSize, hexToSkip] = decodeCompactSize(WitnessItemSizeHex, 16);
            currentOffset += hexToSkip;

            const WitnessItemHex = rawTransaction.substring(currentOffset, currentOffset + WitnessItemSize * 2);
            currentOffset += WitnessItemSize * 2;

            witnessItemsForOneInput[j] = WitnessItemHex
        }
        witnessItemsForAllInputs.push(witnessItemsForOneInput);
    }

    return [witnessItemsForAllInputs, currentOffset];
}

function getLockTime(rawTransaction) {
    const lockTimeHex = rawTransaction.substring(rawTransaction.length - 8);
    const [lockTime, ] = decodeFixedLength(lockTimeHex);
    return lockTime;
}

function addWitnessItemsToInputs(rawTransaction, Inputs) {
    const [witnessItemsForAllInputs,] = getWitnessItems(rawTransaction);

    Inputs.forEach((input, index) => {
        input.txinwitness = witnessItemsForAllInputs[index] || [];
    });

    return Inputs;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter raw transaction hex: ', (rawTransaction) => {
    const isSegWit = isSegWitTransaction(rawTransaction);
    const [hash, ] = convertEndian(sha256Hex(sha256Hex(rawTransaction)))

    const [version, ] = getVersion(rawTransaction);
    let [inputs, ] = getInputs(rawTransaction, isSegWit);
    const [outputs, ] = getOutputs(rawTransaction, isSegWit);
    const lockTime = getLockTime(rawTransaction);

    if (isSegWit) {
        inputs = addWitnessItemsToInputs(rawTransaction, inputs);
    }

    const transaction = {
        hash: hash,
        version: version,
        lockTime: lockTime,
        vin: inputs,
        vout: outputs
    };

    console.log(JSON.stringify(transaction, null, 2));

    rl.close();
});
