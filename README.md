# Transaction Decoder

This is a simple Node.js application that decodes raw Bitcoin transaction. It extracts various fields from the transaction hex input and presents them in a readable format.

## Features

- Decodes raw Bitcoin transactions into human-readable format.
- Supports decoding of version number, lock time, inputs, outputs, and witness data.
- Provides clear output of transaction details including hash, version, input scripts, output scripts, etc.

## Installation

1. Make sure you have Node.js installed on your system. You can download it from [here](https://nodejs.org/).

2. Clone this repository to your local machine:

    ```
    git clone git@github.com:SulaimanAminuBarkindo/transaction-decoder.git
    ```

    if using https use
    ```
    git clone https://github.com/SulaimanAminuBarkindo/transaction-decoder.git
    ```

3. Navigate to the project directory:

    ```
    cd transaction-decoder
    ```

## Usage

1. Run the application:

    ```
    node index.js
    ```

2. Follow the prompts to enter the raw transaction hex.

3. The application will decode the transaction and display the details.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.
