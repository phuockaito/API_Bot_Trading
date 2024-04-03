const express = require('express')
const app = express()
const ccxt = require('ccxt');
const moment = require('moment');

const asciichart = require('asciichart');

const binance = new ccxt.binance({
    'apiKey': 'H4HdfP1TJFs6n9o2BIp2yEeWzABjWbZCoavJJTYVEPR9caxKmlL3bNIQpQt5SI42',
    'secret': 'tbIzhlqGens9Yifmx90Y1OC5HHLIYt03Vw89S5y3KSGLOHnJ33KLBpUSsUU8TlDD',
});
binance.setSandboxMode(true);

// var s = []
async function printBalance(btcPrice) {
    const balance = await binance.fetchBalance();
    const total = balance.total;
    // console.log(`Balance BTC: ${total.BTC} USDT: ${total.USDT}`);
    const USD = (total.BTC - 1) * btcPrice + total.USDT;
    // s.push(USD);
    // console.log(`Total USD: ${USD}.\n`);
    // console.log(`${asciichart.plot(s, { height: 6 })}\n`)
    return USD;
}

async function Tick() {
    const price = await binance.fetchOHLCV('BTC/USDT', '1s', undefined, 100);
    const bPrice = price.map((item) => {
        return {
            time: moment(item[0]).format('YYYY-MM-DD HH:mm:ss'),
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
        }
    })
    const average = bPrice.reduce((a, b) => a + b.close, 0) / bPrice.length;
    const lastPrice = bPrice[bPrice.length - 1].close;
    const direction = lastPrice > average ? 'buy' : 'sell';
    const TRADE_SIZE = 10;
    const quantity = TRADE_SIZE / lastPrice;
    console.log(`Average Price: ${average} Last Price: ${lastPrice} Direction: ${direction} Quantity: ${quantity}`);
    const order = await binance.createMarketOrder('BTC/USDT', direction, quantity);
    console.log(`${moment().format()}: ${direction} ${quantity} BTC at ${lastPrice}`);
    const ar = await printBalance(lastPrice);
    return {
        total_usd: ar,
        average_price: average,
        last_price: lastPrice,
        direction: direction,
        quantity: quantity,
        trade_size: TRADE_SIZE,
        trade_price: lastPrice,
        order
    };
}

app.get('/api/BTC_USDT', async function (req, res) {
    const ar = await Tick();
    res.json({
        ...ar
    });
})

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`)
})
