const myScript = require('./script/scrap');
const express = require('express')
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const app = express()
const yearsUrl = "http://www.caa.gov.tw/big5/content/index.asp?sno=927"


app.use(express.static('views'))
app.use("/users", function(req, res, next){      
    console.log("users中介函式啟動");
    next(); 
});


app.get('/scrap', function(req, res) {
    setAirlinesLink();
    res.send('OK!')
})

const setAirlinesLink = function () {
    console.log("1");
    request({
      url: yearsUrl, 
      method: "GET"
    }, function (error, response, body) {
      if (error || !body) {
        console.log("2");
        console.log(error);
        return;
      }
      console.log("3");
      const $ = cheerio.load(body, {decodeEntities: false}); // 載入 body
    //   const tableYears = $("td > strong > a"); 
      
      console.log("4");
      var yearsData = myScript.getYearsLink($);


      // for updating , continueing..
      yearsData = myScript.getYearContent(yearsData);

    //   fs.writeFileSync("result.json", tableYears);
      
    });
  };

// setAirlinesLink();



app.listen(3000, () => console.log('Example app listening on port 3000!'))