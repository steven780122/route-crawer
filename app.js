const express = require('express')
const app = express()

app.use(express.static('views'))

app.use("/users", function(req, res, next){      
    console.log("users中介函式啟動");
    next(); 
});

app.get('/hello', function (req, res) {
    res.send('Hello World!')
  })
3

app.listen(3000, () => console.log('Example app listening on port 3000!'))



// https://www.caa.gov.tw/APFile/big5/download/ao/1522061640659.xls 107.02
// https://www.caa.gov.tw/APFile/big5/download/ao/1522061662732.xls 下


// https://www.caa.gov.tw/APFile/big5/download/ao/1519883288667.xls 107.01